package service

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"time"

	"github.com/example/authservice/internal/auth"
	"github.com/example/authservice/internal/models"
	"github.com/example/authservice/internal/repository"
)

var (
	ErrInvalidCredentials = errors.New("invalid credentials")
	ErrUserNotActive      = errors.New("user not active")
	ErrMFARequired        = errors.New("mfa verification required")
	ErrEmailTaken         = errors.New("email already taken")
	ErrInvalidToken       = errors.New("invalid token")
	ErrTokenRevoked       = errors.New("token has been revoked")
)

type AuthService interface {
	Register(ctx context.Context, email, password, role string) (*models.User, error)
	Login(ctx context.Context, email, password string) (*auth.TokenPair, *models.User, error)
	LoginWithMFA(ctx context.Context, email, password, mfaCode string) (*auth.TokenPair, *models.User, error)
	RefreshToken(ctx context.Context, refreshToken string) (*auth.TokenPair, error)
	Logout(ctx context.Context, refreshToken string) error
	ValidateAccessToken(ctx context.Context, accessToken string) (*auth.Claims, error)
	EnableMFA(ctx context.Context, userID int64) (string, string, error)
	VerifyMFA(ctx context.Context, userID int64, code string) error
	DisableMFA(ctx context.Context, userID int64) error
}

type authService struct {
	db          *sql.DB
	userRepo    repository.UserRepository
	sessionRepo repository.SessionRepository
	jwtManager  *auth.JWTManager
	mfaService  *auth.MFAService
}

func NewAuthService(
	db *sql.DB,
	userRepo repository.UserRepository,
	sessionRepo repository.SessionRepository,
	jwtManager *auth.JWTManager,
	mfaService *auth.MFAService,
) AuthService {
	return &authService{
		db:          db,
		userRepo:    userRepo,
		sessionRepo: sessionRepo,
		jwtManager:  jwtManager,
		mfaService:  mfaService,
	}
}

func (s *authService) Register(ctx context.Context, email, password, role string) (*models.User, error) {
	existing, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil && !errors.Is(err, repository.ErrNotFound) {
		return nil, fmt.Errorf("check existing user: %w", err)
	}
	if existing != nil {
		return nil, ErrEmailTaken
	}

	passwordHash, err := auth.HashPassword(password)
	if err != nil {
		return nil, fmt.Errorf("hash password: %w", err)
	}

	if role == "" {
		role = "user"
	}

	user := &models.User{
		Email:        email,
		PasswordHash: passwordHash,
		Role:         role,
		IsActive:     true,
	}

	var createdUser *models.User
	if err := s.withTx(ctx, func(tx *sql.Tx) error {
		var err error
		createdUser, err = s.userRepo.Create(ctx, tx, user)
		if err != nil {
			return fmt.Errorf("create user: %w", err)
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return createdUser, nil
}

func (s *authService) Login(ctx context.Context, email, password string) (*auth.TokenPair, *models.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, fmt.Errorf("get user: %w", err)
	}

	if !auth.VerifyPassword(user.PasswordHash, password) {
		return nil, nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, nil, ErrUserNotActive
	}

	if user.MFAEnabled {
		return nil, user, ErrMFARequired
	}

	return s.createTokenPair(ctx, user)
}

func (s *authService) LoginWithMFA(ctx context.Context, email, password, mfaCode string) (*auth.TokenPair, *models.User, error) {
	user, err := s.userRepo.GetByEmail(ctx, email)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, nil, ErrInvalidCredentials
		}
		return nil, nil, fmt.Errorf("get user: %w", err)
	}

	if !auth.VerifyPassword(user.PasswordHash, password) {
		return nil, nil, ErrInvalidCredentials
	}

	if !user.IsActive {
		return nil, nil, ErrUserNotActive
	}

	if !user.MFAEnabled || user.MFASecret == nil {
		return nil, nil, errors.New("mfa not enabled for user")
	}

	if !s.mfaService.ValidateCode(*user.MFASecret, mfaCode) {
		return nil, nil, errors.New("invalid mfa code")
	}

	return s.createTokenPair(ctx, user)
}

func (s *authService) RefreshToken(ctx context.Context, refreshToken string) (*auth.TokenPair, error) {
	claims, err := s.jwtManager.ValidateToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("validate refresh token: %w", err)
	}

	session, err := s.sessionRepo.GetByRefreshToken(ctx, refreshToken)
	if err != nil {
		if errors.Is(err, repository.ErrNotFound) {
			return nil, ErrInvalidToken
		}
		return nil, fmt.Errorf("get session: %w", err)
	}

	if session.IsRevoked {
		return nil, ErrTokenRevoked
	}

	if time.Now().After(session.ExpiresAt) {
		return nil, auth.ErrExpiredToken
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	if err := s.withTx(ctx, func(tx *sql.Tx) error {
		if err := s.sessionRepo.RevokeByRefreshToken(ctx, tx, refreshToken); err != nil {
			return fmt.Errorf("revoke old refresh token: %w", err)
		}
		return nil
	}); err != nil {
		return nil, err
	}

	tokens, _, err := s.createTokenPair(ctx, user)
	if err != nil {
		return nil, err
	}

	return tokens, nil
}

func (s *authService) Logout(ctx context.Context, refreshToken string) error {
	return s.withTx(ctx, func(tx *sql.Tx) error {
		if err := s.sessionRepo.RevokeByRefreshToken(ctx, tx, refreshToken); err != nil {
			return fmt.Errorf("revoke refresh token: %w", err)
		}
		return nil
	})
}

func (s *authService) ValidateAccessToken(ctx context.Context, accessToken string) (*auth.Claims, error) {
	claims, err := s.jwtManager.ValidateToken(accessToken)
	if err != nil {
		return nil, fmt.Errorf("validate access token: %w", err)
	}

	user, err := s.userRepo.GetByID(ctx, claims.UserID)
	if err != nil {
		return nil, fmt.Errorf("get user: %w", err)
	}

	if !user.IsActive {
		return nil, ErrUserNotActive
	}

	return claims, nil
}

func (s *authService) EnableMFA(ctx context.Context, userID int64) (string, string, error) {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return "", "", fmt.Errorf("get user: %w", err)
	}

	secret, url, err := s.mfaService.GenerateSecret(user.Email)
	if err != nil {
		return "", "", fmt.Errorf("generate mfa secret: %w", err)
	}

	if err := s.withTx(ctx, func(tx *sql.Tx) error {
		if err := s.userRepo.SetMFASecret(ctx, tx, userID, secret); err != nil {
			return fmt.Errorf("set mfa secret: %w", err)
		}
		return nil
	}); err != nil {
		return "", "", err
	}

	return secret, url, nil
}

func (s *authService) VerifyMFA(ctx context.Context, userID int64, code string) error {
	user, err := s.userRepo.GetByID(ctx, userID)
	if err != nil {
		return fmt.Errorf("get user: %w", err)
	}

	if user.MFASecret == nil {
		return errors.New("mfa secret not generated")
	}

	if !s.mfaService.ValidateCode(*user.MFASecret, code) {
		return errors.New("invalid mfa code")
	}

	return s.withTx(ctx, func(tx *sql.Tx) error {
		if err := s.userRepo.UpdateMFA(ctx, tx, userID, true, user.MFASecret); err != nil {
			return fmt.Errorf("update mfa: %w", err)
		}
		return nil
	})
}

func (s *authService) DisableMFA(ctx context.Context, userID int64) error {
	return s.withTx(ctx, func(tx *sql.Tx) error {
		if err := s.userRepo.UpdateMFA(ctx, tx, userID, false, nil); err != nil {
			return fmt.Errorf("update mfa: %w", err)
		}
		return nil
	})
}

func (s *authService) createTokenPair(ctx context.Context, user *models.User) (*auth.TokenPair, *models.User, error) {
	accessToken, err := s.jwtManager.GenerateAccessToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, fmt.Errorf("generate access token: %w", err)
	}

	refreshToken, err := s.jwtManager.GenerateRefreshToken(user.ID, user.Email, user.Role)
	if err != nil {
		return nil, nil, fmt.Errorf("generate refresh token: %w", err)
	}

	session := &models.Session{
		UserID:       user.ID,
		RefreshToken: refreshToken,
		ExpiresAt:    time.Now().Add(s.jwtManager.RefreshTokenTTL()),
	}

	if err := s.withTx(ctx, func(tx *sql.Tx) error {
		if _, err := s.sessionRepo.Create(ctx, tx, session); err != nil {
			return fmt.Errorf("create session: %w", err)
		}
		return nil
	}); err != nil {
		return nil, nil, err
	}

	tokenPair := &auth.TokenPair{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
	}

	return tokenPair, user, nil
}

func (s *authService) withTx(ctx context.Context, fn func(*sql.Tx) error) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return fmt.Errorf("begin transaction: %w", err)
	}

	if err := fn(tx); err != nil {
		_ = tx.Rollback()
		return err
	}

	if err := tx.Commit(); err != nil {
		_ = tx.Rollback()
		return fmt.Errorf("commit transaction: %w", err)
	}

	return nil
}
