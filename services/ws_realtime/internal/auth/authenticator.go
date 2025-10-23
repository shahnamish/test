package auth

import (
	"errors"
	"fmt"
	"strings"

	"github.com/golang-jwt/jwt/v5"
)

var (
	// ErrUnauthorized indicates that the provided credentials are invalid or missing.
	ErrUnauthorized = errors.New("unauthorized")
)

// Authenticator validates bearer tokens presented by WebSocket clients.
type Authenticator struct {
	secret []byte
}

// New returns an authenticator configured with the provided HMAC secret.
func New(secret string) (*Authenticator, error) {
	secret = strings.TrimSpace(secret)
	if secret == "" {
		return nil, errors.New("authentication secret must not be empty")
	}

	return &Authenticator{secret: []byte(secret)}, nil
}

// Claims represents the subset of JWT claims required by the service.
type Claims struct {
	jwt.RegisteredClaims
}

// Validate parses and validates the supplied JWT token string.
// It returns the subject (user identifier) if verification succeeds.
func (a *Authenticator) Validate(token string) (string, error) {
	if strings.TrimSpace(token) == "" {
		return "", ErrUnauthorized
	}

	claims := &Claims{}
	parsedToken, err := jwt.ParseWithClaims(token, claims, func(t *jwt.Token) (interface{}, error) {
		if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %s", t.Header["alg"])
		}
		return a.secret, nil
	})
	if err != nil {
		return "", ErrUnauthorized
	}

	if !parsedToken.Valid {
		return "", ErrUnauthorized
	}

	subject := strings.TrimSpace(claims.Subject)
	if subject == "" {
		return "", ErrUnauthorized
	}

	return subject, nil
}
