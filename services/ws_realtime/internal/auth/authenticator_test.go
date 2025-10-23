package auth_test

import (
	"testing"
	"time"

	"github.com/golang-jwt/jwt/v5"

	"github.com/enterprise/ws-realtime/internal/auth"
)

func TestAuthenticatorValidateSuccess(t *testing.T) {
	authenticator, err := auth.New("super-secret")
	if err != nil {
		t.Fatalf("unexpected error constructing authenticator: %v", err)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "user-123",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	})
	signed, err := token.SignedString([]byte("super-secret"))
	if err != nil {
		t.Fatalf("failed to sign jwt: %v", err)
	}

	sub, err := authenticator.Validate(signed)
	if err != nil {
		t.Fatalf("expected no error validating token, got %v", err)
	}

	if sub != "user-123" {
		t.Fatalf("expected subject user-123, got %s", sub)
	}
}

func TestAuthenticatorRejectsInvalidSignature(t *testing.T) {
	authenticator, err := auth.New("primary-secret")
	if err != nil {
		t.Fatalf("unexpected error constructing authenticator: %v", err)
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, jwt.RegisteredClaims{
		Subject:   "user-456",
		ExpiresAt: jwt.NewNumericDate(time.Now().Add(time.Minute)),
	})
	signed, err := token.SignedString([]byte("other-secret"))
	if err != nil {
		t.Fatalf("failed to sign jwt: %v", err)
	}

	if _, err := authenticator.Validate(signed); err == nil {
		t.Fatalf("expected error validating token with wrong signature")
	}
}
