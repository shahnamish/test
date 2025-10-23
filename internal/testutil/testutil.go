package testutil

import (
	"context"
	"database/sql"
	"fmt"
	"testing"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func SetupTestDB(t *testing.T) (*sql.DB, func()) {
	t.Helper()

	dsn := "host=localhost port=5432 user=postgres password=postgres dbname=authservice_test sslmode=disable"
	db, err := sql.Open("pgx", dsn)
	if err != nil {
		t.Skipf("failed to connect to test database: %v", err)
	}

	if err := db.Ping(); err != nil {
		db.Close()
		t.Skipf("failed to ping test database: %v", err)
	}

	cleanup := func() {
		db.Close()
	}

	return db, cleanup
}

func TruncateTables(ctx context.Context, db *sql.DB, tables ...string) error {
	for _, table := range tables {
		if _, err := db.ExecContext(ctx, fmt.Sprintf("TRUNCATE TABLE %s CASCADE", table)); err != nil {
			return err
		}
	}
	return nil
}
