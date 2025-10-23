package repository

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	"github.com/example/authservice/internal/models"
)

var (
	ErrNotFound = errors.New("not found")
)

type SessionRepository interface {
	Create(ctx context.Context, tx *sql.Tx, session *models.Session) (*models.Session, error)
	GetByRefreshToken(ctx context.Context, token string) (*models.Session, error)
	RevokeByRefreshToken(ctx context.Context, tx *sql.Tx, token string) error
	RevokeAllUserSessions(ctx context.Context, tx *sql.Tx, userID int64) error
	DeleteExpired(ctx context.Context) error
}

type sessionRepository struct {
	db *sql.DB
}

func NewSessionRepository(db *sql.DB) SessionRepository {
	return &sessionRepository{db: db}
}

func (r *sessionRepository) getQueryer(tx *sql.Tx) queryRowContext {
	if tx != nil {
		return tx
	}
	return r.db
}

func (r *sessionRepository) getExecutor(tx *sql.Tx) execContext {
	if tx != nil {
		return tx
	}
	return r.db
}

func (r *sessionRepository) Create(ctx context.Context, tx *sql.Tx, session *models.Session) (*models.Session, error) {
	query := `INSERT INTO sessions (user_id, refresh_token, expires_at) VALUES ($1, $2, $3) RETURNING id, created_at`
	row := r.getQueryer(tx).QueryRowContext(ctx, query, session.UserID, session.RefreshToken, session.ExpiresAt)
	if err := row.Scan(&session.ID, &session.CreatedAt); err != nil {
		return nil, fmt.Errorf("insert session: %w", err)
	}
	return session, nil
}

func (r *sessionRepository) GetByRefreshToken(ctx context.Context, token string) (*models.Session, error) {
	query := `SELECT id, user_id, refresh_token, expires_at, created_at, is_revoked FROM sessions WHERE refresh_token = $1`
	row := r.db.QueryRowContext(ctx, query, token)

	var session models.Session
	if err := row.Scan(&session.ID, &session.UserID, &session.RefreshToken, &session.ExpiresAt, &session.CreatedAt, &session.IsRevoked); err != nil {
		if errors.Is(err, sql.ErrNoRows) {
			return nil, ErrNotFound
		}
		return nil, fmt.Errorf("scan session: %w", err)
	}
	return &session, nil
}

func (r *sessionRepository) RevokeByRefreshToken(ctx context.Context, tx *sql.Tx, token string) error {
	query := `UPDATE sessions SET is_revoked = TRUE WHERE refresh_token = $1`
	if _, err := r.getExecutor(tx).ExecContext(ctx, query, token); err != nil {
		return fmt.Errorf("revoke session: %w", err)
	}
	return nil
}

func (r *sessionRepository) RevokeAllUserSessions(ctx context.Context, tx *sql.Tx, userID int64) error {
	query := `UPDATE sessions SET is_revoked = TRUE WHERE user_id = $1`
	if _, err := r.getExecutor(tx).ExecContext(ctx, query, userID); err != nil {
		return fmt.Errorf("revoke user sessions: %w", err)
	}
	return nil
}

func (r *sessionRepository) DeleteExpired(ctx context.Context) error {
	query := `DELETE FROM sessions WHERE expires_at < NOW()`
	if _, err := r.db.ExecContext(ctx, query); err != nil {
		return fmt.Errorf("delete expired sessions: %w", err)
	}
	return nil
}
