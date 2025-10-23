package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/example/authservice/internal/models"
)

type UserRepository interface {
	Create(ctx context.Context, tx *sql.Tx, user *models.User) (*models.User, error)
	GetByEmail(ctx context.Context, email string) (*models.User, error)
	GetByID(ctx context.Context, id int64) (*models.User, error)
	SetMFASecret(ctx context.Context, tx *sql.Tx, userID int64, secret string) error
	UpdateMFA(ctx context.Context, tx *sql.Tx, userID int64, enabled bool, secret *string) error
}

type queryRowContext interface {
	QueryRowContext(ctx context.Context, query string, args ...any) *sql.Row
}

type execContext interface {
	ExecContext(ctx context.Context, query string, args ...any) (sql.Result, error)
}

type userRepository struct {
	db *sql.DB
}

func NewUserRepository(db *sql.DB) UserRepository {
	return &userRepository{db: db}
}

func (r *userRepository) getQueryer(tx *sql.Tx) queryRowContext {
	if tx != nil {
		return tx
	}
	return r.db
}

func (r *userRepository) getExecutor(tx *sql.Tx) execContext {
	if tx != nil {
		return tx
	}
	return r.db
}

func (r *userRepository) Create(ctx context.Context, tx *sql.Tx, user *models.User) (*models.User, error) {
	query := `INSERT INTO users (email, password_hash, role, mfa_enabled, mfa_secret, is_active) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, created_at, updated_at`
	row := r.getQueryer(tx).QueryRowContext(ctx, query, user.Email, user.PasswordHash, user.Role, user.MFAEnabled, user.MFASecret, user.IsActive)
	if err := row.Scan(&user.ID, &user.CreatedAt, &user.UpdatedAt); err != nil {
		return nil, fmt.Errorf("insert user: %w", err)
	}
	return user, nil
}

func (r *userRepository) GetByEmail(ctx context.Context, email string) (*models.User, error) {
	query := `SELECT id, email, password_hash, role, mfa_enabled, mfa_secret, is_active, created_at, updated_at FROM users WHERE email = $1`
	row := r.db.QueryRowContext(ctx, query, email)
	return scanUser(row)
}

func (r *userRepository) GetByID(ctx context.Context, id int64) (*models.User, error) {
	query := `SELECT id, email, password_hash, role, mfa_enabled, mfa_secret, is_active, created_at, updated_at FROM users WHERE id = $1`
	row := r.db.QueryRowContext(ctx, query, id)
	return scanUser(row)
}

func (r *userRepository) SetMFASecret(ctx context.Context, tx *sql.Tx, userID int64, secret string) error {
	query := `UPDATE users SET mfa_secret = $1, mfa_enabled = FALSE, updated_at = NOW() WHERE id = $2`
	if _, err := r.getExecutor(tx).ExecContext(ctx, query, secret, userID); err != nil {
		return fmt.Errorf("set mfa secret: %w", err)
	}
	return nil
}

func (r *userRepository) UpdateMFA(ctx context.Context, tx *sql.Tx, userID int64, enabled bool, secret *string) error {
	query := `UPDATE users SET mfa_enabled = $1, mfa_secret = $2, updated_at = NOW() WHERE id = $3`
	if _, err := r.getExecutor(tx).ExecContext(ctx, query, enabled, secret, userID); err != nil {
		return fmt.Errorf("update mfa: %w", err)
	}
	return nil
}

func scanUser(row *sql.Row) (*models.User, error) {
	var user models.User
	if err := row.Scan(&user.ID, &user.Email, &user.PasswordHash, &user.Role, &user.MFAEnabled, &user.MFASecret, &user.IsActive, &user.CreatedAt, &user.UpdatedAt); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scan user: %w", err)
	}
	return &user, nil
}
