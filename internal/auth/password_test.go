package auth_test

import (
	"testing"

	"github.com/example/authservice/internal/auth"
)

func TestHashAndVerifyPassword(t *testing.T) {
	password := "SuperSecurePassword!"

	hash, err := auth.HashPassword(password)
	if err != nil {
		t.Fatalf("unexpected error hashing password: %v", err)
	}

	if hash == password {
		t.Fatalf("hashed password should not equal original password")
	}

	if !auth.VerifyPassword(hash, password) {
		t.Fatalf("expected password verification to succeed")
	}

	if auth.VerifyPassword(hash, "wrong") {
		t.Fatalf("expected password verification to fail for wrong password")
	}
}
