package models

import "time"

type Session struct {
	ID           int64     `db:"id" json:"id"`
	UserID       int64     `db:"user_id" json:"userId"`
	RefreshToken string    `db:"refresh_token" json:"-"`
	ExpiresAt    time.Time `db:"expires_at" json:"expiresAt"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	IsRevoked    bool      `db:"is_revoked" json:"isRevoked"`
}
