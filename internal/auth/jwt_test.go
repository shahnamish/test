package auth_test

import (
	"testing"
	"time"

	"github.com/example/authservice/internal/auth"
)

func TestJWTManager_GenerateAndValidateToken(t *testing.T) {
	manager := auth.NewJWTManager(
		"test-secret",
		15*time.Minute,
		7*24*time.Hour,
		"test-issuer",
	)

	t.Run("access token", func(t *testing.T) {
		token, err := manager.GenerateAccessToken(1, "test@example.com", "user")
		if err != nil {
			t.Fatalf("unexpected error generating access token: %v", err)
		}

		claims, err := manager.ValidateToken(token)
		if err != nil {
			t.Fatalf("unexpected error validating token: %v", err)
		}

		if claims.UserID != 1 {
			t.Errorf("expected user ID 1, got %d", claims.UserID)
		}

		if claims.Email != "test@example.com" {
			t.Errorf("expected email test@example.com, got %s", claims.Email)
		}

		if claims.Role != "user" {
			t.Errorf("expected role user, got %s", claims.Role)
		}
	})

	t.Run("invalid token", func(t *testing.T) {
		_, err := manager.ValidateToken("invalid-token")
		if err == nil {
			t.Fatal("expected error validating invalid token")
		}
	})

	t.Run("expired token", func(t *testing.T) {
		shortManager := auth.NewJWTManager(
			"test-secret",
			-1*time.Second,
			7*24*time.Hour,
			"test-issuer",
		)

		token, err := shortManager.GenerateAccessToken(1, "test@example.com", "user")
		if err != nil {
			t.Fatalf("unexpected error generating token: %v", err)
		}

		time.Sleep(100 * time.Millisecond)

		_, err = shortManager.ValidateToken(token)
		if err != auth.ErrExpiredToken {
			t.Errorf("expected ErrExpiredToken, got %v", err)
		}
	})
}
