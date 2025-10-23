package repository

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/betting/odds-ingest/internal/config"
	"github.com/betting/odds-ingest/internal/normalizer"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"database/sql"
)

// PostgresRepository persists odds snapshots into Postgres.
type PostgresRepository struct {
	db             *sql.DB
	table          string
	durationMetric prometheus.Observer
}

// NewPostgresRepository connects to Postgres and ensures the snapshots table exists.
func NewPostgresRepository(cfg config.PostgresConfig) (*PostgresRepository, error) {
	db, err := sql.Open("postgres", cfg.DSN)
	if err != nil {
		return nil, fmt.Errorf("failed to connect to Postgres: %w", err)
	}

	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	if err := db.Ping(); err != nil {
		return nil, fmt.Errorf("failed to ping Postgres: %w", err)
	}

	table := fmt.Sprintf("%s.%s", cfg.Schema, cfg.Table)
	createStmt := fmt.Sprintf(`CREATE TABLE IF NOT EXISTS %s (
		id SERIAL PRIMARY KEY,
		event_id TEXT NOT NULL,
		sport_key TEXT NOT NULL,
		sport_title TEXT,
		commence_time TIMESTAMPTZ,
		home_team TEXT,
		away_team TEXT,
		payload JSONB NOT NULL,
		retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
	);`, table)

	if _, err := db.Exec(createStmt); err != nil {
		return nil, fmt.Errorf("failed to ensure odds snapshots table: %w", err)
	}

	durationMetric := promauto.NewHistogram(prometheus.HistogramOpts{
		Name:    "odds_ingest_repository_insert_seconds",
		Help:    "Histogram of snapshot insert durations",
		Buckets: prometheus.DefBuckets,
	})

	log.Printf("Connected to Postgres and ensured table %s", table)

	return &PostgresRepository{
		db:             db,
		table:          table,
		durationMetric: durationMetric,
	}, nil
}

// StoreSnapshot persists an odds snapshot.
func (r *PostgresRepository) StoreSnapshot(ctx context.Context, event normalizer.NormalizedEvent) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal normalized event: %w", err)
	}

	start := time.Now()
	query := fmt.Sprintf(`INSERT INTO %s (event_id, sport_key, sport_title, commence_time, home_team, away_team, payload, retrieved_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`, r.table)

	_, err = r.db.ExecContext(
		ctx,
		query,
		event.EventID,
		event.SportKey,
		event.SportTitle,
		event.CommenceTime,
		event.HomeTeam,
		event.AwayTeam,
		payload,
		event.RetrievedAt,
	)

	r.durationMetric.Observe(time.Since(start).Seconds())

	if err != nil {
		return fmt.Errorf("failed to insert snapshot: %w", err)
	}
	return nil
}

// Close releases the underlying DB connection.
func (r *PostgresRepository) Close() error {
	return r.db.Close()
}
