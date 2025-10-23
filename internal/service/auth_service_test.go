package service_test

import (
	"context"
	"database/sql"
	"errors"
	"testing"
	"time"

	"github.com/DATA-DOG/go-sqlmock"
	"github.com/example/authservice/internal/auth"
	"github.com/example/authservice/internal/models"
	"github.com/example/authservice/internal/repository"
	"github.com/example/authservice/internal/service"
	"github.com/pquerna/otp/totp"
)

type mockUserRepo struct {
	usersByEmail map[string]*models.User
	usersByID    map[int64]*models.User
	nextID       int64
}

func newMockUserRepo() *mockUserRepo {
	return &mockUserRepo{
		usersByEmail: make(map[string]*models.User),
		usersByID:    make(map[int64]*models.User),
		nextID:       1,
	}
}

func (m *mockUserRepo) Create(_ context.Context, _ *sql.Tx, user *models.User) (*models.User, error) {
	user.ID = m.nextID
	m.nextID++

	copyUser := *user
	m.usersByEmail[user.Email] = &copyUser
	m.usersByID[user.ID] = &copyUser

	return &copyUser, nil
}

func (m *mockUserRepo) GetByEmail(_ context.Context, email string) (*models.User, error) {
	if user, ok := m.usersByEmail[email]; ok {
		copyUser := *user
		return &copyUser, nil
	}
	return nil, repository.ErrNotFound
}

func (m *mockUserRepo) GetByID(_ context.Context, id int64) (*models.User, error) {
	if user, ok := m.usersByID[id]; ok {
		copyUser := *user
		return &copyUser, nil
	}
	return nil, repository.ErrNotFound
}

func (m *mockUserRepo) SetMFASecret(_ context.Context, _ *sql.Tx, userID int64, secret string) error {
	if user, ok := m.usersByID[userID]; ok {
		user.MFASecret = &secret
		user.MFAEnabled = false
		return nil
	}
	return repository.ErrNotFound
}

func (m *mockUserRepo) UpdateMFA(_ context.Context, _ *sql.Tx, userID int64, enabled bool, secret *string) error {
	if user, ok := m.usersByID[userID]; ok {
		user.MFAEnabled = enabled
		user.MFASecret = secret
		return nil
	}
	return repository.ErrNotFound
}

type mockSessionRepo struct {
	sessions []*models.Session
}

func (m *mockSessionRepo) Create(_ context.Context, _ *sql.Tx, session *models.Session) (*models.Session, error) {
	copySession := *session
	m.sessions = append(m.sessions, &copySession)
	return &copySession, nil
}

func (m *mockSessionRepo) GetByRefreshToken(_ context.Context, token string) (*models.Session, error) {
	for _, session := range m.sessions {
		if session.RefreshToken == token {
			copySession := *session
			return &copySession, nil
		}
	}
	return nil, repository.ErrNotFound
}

func (m *mockSessionRepo) RevokeByRefreshToken(_ context.Context, _ *sql.Tx, token string) error {
	for _, session := range m.sessions {
		if session.RefreshToken == token {
			session.IsRevoked = true
			return nil
		}
	}
	return repository.ErrNotFound
}

func (m *mockSessionRepo) RevokeAllUserSessions(context.Context, *sql.Tx, int64) error {
	return nil
}

func (m *mockSessionRepo) DeleteExpired(context.Context) error {
	return nil
}

func newTestAuthService(t *testing.T) (service.AuthService, sqlmock.Sqlmock, *mockUserRepo, *mockSessionRepo, func()) {
	db, mock, err := sqlmock.New()
	if err != nil {
		t.Fatalf("failed to create sqlmock: %v", err)
	}

	userRepo := newMockUserRepo()
	sessionRepo := &mockSessionRepo{}
	jwtManager := auth.NewJWTManager("secret", time.Minute, time.Hour, "issuer")
	mfaService := auth.NewMFAService("issuer")

	svc := service.NewAuthService(db, userRepo, sessionRepo, jwtManager, mfaService)

	cleanup := func() {
		db.Close()
	}

	return svc, mock, userRepo, sessionRepo, cleanup
}

func TestAuthService_Register(t *testing.T) {
	svc, mock, _, _, cleanup := newTestAuthService(t)
	defer cleanup()

	t.Run("register new user", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectCommit()

		user, err := svc.Register(context.Background(), "test@example.com", "password", "")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if user.Email != "test@example.com" {
			t.Fatalf("expected email test@example.com, got %s", user.Email)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})

	t.Run("email already taken", func(t *testing.T) {
		_, err := svc.Register(context.Background(), "test@example.com", "password", "")
		if !errors.Is(err, service.ErrEmailTaken) {
			t.Fatalf("expected ErrEmailTaken, got %v", err)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})
}

func TestAuthService_Login(t *testing.T) {
	svc, mock, userRepo, sessionRepo, cleanup := newTestAuthService(t)
	defer cleanup()

	passwordHash, _ := auth.HashPassword("password")
	userRepo.usersByEmail["user@example.com"] = &models.User{
		ID:           1,
		Email:        "user@example.com",
		PasswordHash: passwordHash,
		Role:         "user",
		IsActive:     true,
	}
	userRepo.usersByID[1] = userRepo.usersByEmail["user@example.com"]

	t.Run("successful login", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectCommit()

		tokens, user, err := svc.Login(context.Background(), "user@example.com", "password")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if tokens.AccessToken == "" || tokens.RefreshToken == "" {
			t.Fatalf("expected non-empty tokens")
		}

		if user.Email != "user@example.com" {
			t.Fatalf("unexpected user returned")
		}

		if len(sessionRepo.sessions) != 1 {
			t.Fatalf("expected session to be created")
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})

	t.Run("invalid password", func(t *testing.T) {
		_, _, err := svc.Login(context.Background(), "user@example.com", "wrong")
		if !errors.Is(err, service.ErrInvalidCredentials) {
			t.Fatalf("expected ErrInvalidCredentials, got %v", err)
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})

	t.Run("mfa required", func(t *testing.T) {
		user := userRepo.usersByEmail["user@example.com"]
		user.MFAEnabled = true
		_, _, err := svc.Login(context.Background(), "user@example.com", "password")
		if !errors.Is(err, service.ErrMFARequired) {
			t.Fatalf("expected ErrMFARequired, got %v", err)
		}
		user.MFAEnabled = false

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})
}

func TestAuthService_LoginWithMFA(t *testing.T) {
	svc, mock, userRepo, _, cleanup := newTestAuthService(t)
	defer cleanup()

	passwordHash, _ := auth.HashPassword("password")
	mfaService := auth.NewMFAService("issuer")
	secret, _, err := mfaService.GenerateSecret("mfa@example.com")
	if err != nil {
		t.Fatalf("failed to generate secret: %v", err)
	}

	user := &models.User{
		ID:           1,
		Email:        "mfa@example.com",
		PasswordHash: passwordHash,
		Role:         "user",
		IsActive:     true,
		MFAEnabled:   true,
		MFASecret:    &secret,
	}

	userRepo.usersByEmail[user.Email] = user
	userRepo.usersByID[user.ID] = user

	t.Run("valid mfa code", func(t *testing.T) {
		mock.ExpectBegin()
		mock.ExpectCommit()

		code, err := totp.GenerateCode(secret, time.Now())
		if err != nil {
			t.Fatalf("failed to generate code: %v", err)
		}

		tokens, _, err := svc.LoginWithMFA(context.Background(), user.Email, "password", code)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		if tokens.AccessToken == "" {
			t.Fatalf("expected access token")
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})

	t.Run("invalid mfa code", func(t *testing.T) {
		_, _, err := svc.LoginWithMFA(context.Background(), user.Email, "password", "000000")
		if err == nil {
			t.Fatalf("expected error for invalid mfa code")
		}

		if err := mock.ExpectationsWereMet(); err != nil {
			t.Fatalf("unmet expectations: %v", err)
		}
	})
}
