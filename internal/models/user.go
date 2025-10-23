package models

import "time"

type User struct {
	ID           int64     `db:"id" json:"id"`
	Email        string    `db:"email" json:"email"`
	PasswordHash string    `db:"password_hash" json:"-"`
	Role         string    `db:"role" json:"role"`
	MFAEnabled   bool      `db:"mfa_enabled" json:"mfaEnabled"`
	MFASecret    *string   `db:"mfa_secret" json:"-"`
	IsActive     bool      `db:"is_active" json:"isActive"`
	CreatedAt    time.Time `db:"created_at" json:"createdAt"`
	UpdatedAt    time.Time `db:"updated_at" json:"updatedAt"`
}
