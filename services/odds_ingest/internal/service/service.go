package service

import (
	"context"
	"fmt"
	"log"
	"math"
	"time"

	"github.com/betting/odds-ingest/internal/config"
	"github.com/betting/odds-ingest/internal/metrics"
	"github.com/betting/odds-ingest/internal/normalizer"
	"github.com/betting/odds-ingest/internal/oddsapi"
)

// OddsFetcher abstracts calls to The Odds API.
type OddsFetcher interface {
	FetchOdds(ctx context.Context, sport string, regions, markets []string, oddsFormat, dateFormat string) ([]oddsapi.Odds, error)
}

// Normalizer abstracts normalization logic for odds payloads.
type Normalizer interface {
	Normalize(raw oddsapi.Odds, retrievedAt time.Time) normalizer.NormalizedEvent
}

// Producer defines the behaviour needed for publishing normalized events.
type Producer interface {
	Publish(event normalizer.NormalizedEvent) error
}

// Repository defines the behaviour needed to persist normalized events.
type Repository interface {
	StoreSnapshot(ctx context.Context, event normalizer.NormalizedEvent) error
}

// RateLimiter defines throttling behaviour.
type RateLimiter interface {
	Wait(ctx context.Context) error
}

// IngestService orchestrates fetching, normalizing, and publishing odds.
type IngestService struct {
	cfg         config.Config
	fetcher     OddsFetcher
	normalizer  Normalizer
	producer    Producer
	repo        Repository
	rateLimiter RateLimiter
	metrics     *metrics.Metrics
}

// New constructs an IngestService.
func New(
	cfg config.Config,
	fetcher OddsFetcher,
	normalizer Normalizer,
	producer Producer,
	repo Repository,
	rateLimiter RateLimiter,
	metrics *metrics.Metrics,
) *IngestService {
	return &IngestService{
		cfg:         cfg,
		fetcher:     fetcher,
		normalizer:  normalizer,
		producer:    producer,
		repo:        repo,
		rateLimiter: rateLimiter,
		metrics:     metrics,
	}
}

// Start begins periodic ingestion of odds data.
func (s *IngestService) Start(ctx context.Context) {
	ticker := time.NewTicker(s.cfg.FetchInterval)
	defer ticker.Stop()

	log.Printf("Starting ingestion loop with interval=%s for sports=%v", s.cfg.FetchInterval, s.cfg.Sports)

	s.ingestOnce(ctx)

	for {
		select {
		case <-ctx.Done():
			log.Println("Ingestion loop cancelled")
			return
		case <-ticker.C:
			s.ingestOnce(ctx)
		}
	}
}

func (s *IngestService) ingestOnce(ctx context.Context) {
	for _, sport := range s.cfg.Sports {
		if err := s.rateLimiter.Wait(ctx); err != nil {
			log.Printf("Rate limiter wait error: %v", err)
			return
		}

		s.metrics.RequestsTotal.Inc()

		odds, err := s.fetchWithRetry(ctx, sport)
		if err != nil {
			s.metrics.FailuresTotal.Inc()
			log.Printf("Failed to fetch odds for sport=%s: %v", sport, err)
			continue
		}

		s.metrics.SuccessTotal.Inc()
		s.metrics.LastPollGauge.SetToCurrentTime()

		retrievedAt := time.Now().UTC()

		for _, rawOdds := range odds {
			normalized := s.normalizer.Normalize(rawOdds, retrievedAt)

			if err := s.producer.Publish(normalized); err != nil {
				s.metrics.KafkaFailures.Inc()
				log.Printf("Failed to publish event_id=%s to Kafka: %v", normalized.EventID, err)
			} else {
				s.metrics.KafkaSuccess.Inc()
			}

			if err := s.repo.StoreSnapshot(ctx, normalized); err != nil {
				s.metrics.DBFailures.Inc()
				log.Printf("Failed to store snapshot event_id=%s: %v", normalized.EventID, err)
			} else {
				s.metrics.DBSuccess.Inc()
			}
		}
	}
}

func (s *IngestService) fetchWithRetry(ctx context.Context, sport string) ([]oddsapi.Odds, error) {
	var odds []oddsapi.Odds
	var lastErr error

	for attempt := 0; attempt < s.cfg.Retry.MaxAttempts; attempt++ {
		if attempt > 0 {
			backoff := time.Duration(math.Pow(2, float64(attempt-1))) * s.cfg.Retry.InitialBackoff
			if backoff > s.cfg.Retry.MaxBackoff {
				backoff = s.cfg.Retry.MaxBackoff
			}
			log.Printf("Retrying fetch for sport=%s after %v (attempt %d/%d)", sport, backoff, attempt+1, s.cfg.Retry.MaxAttempts)
			select {
			case <-ctx.Done():
				return nil, ctx.Err()
			case <-time.After(backoff):
			}
		}

		odds, lastErr = s.fetcher.FetchOdds(ctx, sport, s.cfg.Regions, s.cfg.Markets, s.cfg.OddsFormat, s.cfg.DateFormat)
		if lastErr == nil {
			return odds, nil
		}
	}

	return nil, fmt.Errorf("max retries exceeded for sport=%s: %w", sport, lastErr)
}
