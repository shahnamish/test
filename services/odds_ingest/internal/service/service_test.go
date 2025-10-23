package service_test

import (
	"context"
	"testing"
	"time"

	"github.com/betting/odds-ingest/internal/config"
	"github.com/betting/odds-ingest/internal/metrics"
	"github.com/betting/odds-ingest/internal/oddsapi"
	"github.com/betting/odds-ingest/internal/service"
	"github.com/prometheus/client_golang/prometheus"
)

func TestIngestService_SuccessfulFetch(t *testing.T) {
	cfg := config.Config{
		Sports:        []string{"basketball_nba"},
		Regions:       []string{"us"},
		Markets:       []string{"h2h"},
		OddsFormat:    "decimal",
		DateFormat:    "iso",
		FetchInterval: time.Minute,
		Retry: config.RetryConfig{
			MaxAttempts:    3,
			InitialBackoff: 100 * time.Millisecond,
			MaxBackoff:     time.Second,
		},
	}

	fetcher := &mockFetcher{
		data: []oddsapi.Odds{
			{
				ID:           "event1",
				SportKey:     "basketball_nba",
				SportTitle:   "NBA",
				CommenceTime: "2024-10-23T20:00:00Z",
				HomeTeam:     "Lakers",
				AwayTeam:     "Warriors",
			},
		},
	}

	normalizer := &mockNormalizer{}
	producer := &mockProducer{}
	repo := &mockRepository{}
	rateLimiter := &mockRateLimiter{}
	registry := prometheus.NewRegistry()
	metricsInst := metrics.NewWith(registry)

	svc := service.New(cfg, fetcher, normalizer, producer, repo, rateLimiter, metricsInst)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	go svc.Start(ctx)

	time.Sleep(500 * time.Millisecond)
	cancel()

	if len(producer.published) != 1 {
		t.Errorf("expected 1 published event, got %d", len(producer.published))
	}
	if len(repo.stored) != 1 {
		t.Errorf("expected 1 stored event, got %d", len(repo.stored))
	}
}

func TestIngestService_RetryOnTransientFailure(t *testing.T) {
	cfg := config.Config{
		Sports:        []string{"soccer_epl"},
		Regions:       []string{"us"},
		Markets:       []string{"h2h"},
		OddsFormat:    "decimal",
		DateFormat:    "iso",
		FetchInterval: time.Minute,
		Retry: config.RetryConfig{
			MaxAttempts:    4,
			InitialBackoff: 10 * time.Millisecond,
			MaxBackoff:     50 * time.Millisecond,
		},
	}

	fetcher := &failingFetcher{
		attemptsFail: 2,
		successData: []oddsapi.Odds{
			{
				ID:       "event2",
				SportKey: "soccer_epl",
				HomeTeam: "Arsenal",
				AwayTeam: "Chelsea",
			},
		},
	}

	normalizer := &mockNormalizer{}
	producer := &mockProducer{}
	repo := &mockRepository{}
	rateLimiter := &mockRateLimiter{}
	registry := prometheus.NewRegistry()
	metricsInst := metrics.NewWith(registry)

	svc := service.New(cfg, fetcher, normalizer, producer, repo, rateLimiter, metricsInst)

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	go svc.Start(ctx)

	time.Sleep(500 * time.Millisecond)
	cancel()

	if fetcher.attempts < 3 {
		t.Errorf("expected at least 3 attempts, got %d", fetcher.attempts)
	}

	if len(producer.published) != 1 {
		t.Errorf("expected 1 published event after retry, got %d", len(producer.published))
	}
}
