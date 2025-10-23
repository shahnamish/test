package service_test

import (
	"context"
	"fmt"
	"time"

	"github.com/betting/odds-ingest/internal/normalizer"
	"github.com/betting/odds-ingest/internal/oddsapi"
)

type mockFetcher struct {
	data []oddsapi.Odds
	err  error
}

func (m *mockFetcher) FetchOdds(ctx context.Context, sport string, regions, markets []string, oddsFormat, dateFormat string) ([]oddsapi.Odds, error) {
	if m.err != nil {
		return nil, m.err
	}
	return m.data, nil
}

type mockNormalizer struct{}

func (m *mockNormalizer) Normalize(raw oddsapi.Odds, retrievedAt time.Time) normalizer.NormalizedEvent {
	return normalizer.NormalizedEvent{
		EventID:      raw.ID,
		SportKey:     raw.SportKey,
		SportTitle:   raw.SportTitle,
		CommenceTime: time.Time{},
		HomeTeam:     raw.HomeTeam,
		AwayTeam:     raw.AwayTeam,
		Markets:      nil,
		RetrievedAt:  retrievedAt,
	}
}

type mockProducer struct {
	published []normalizer.NormalizedEvent
	err       error
}

func (m *mockProducer) Publish(event normalizer.NormalizedEvent) error {
	if m.err != nil {
		return m.err
	}
	m.published = append(m.published, event)
	return nil
}

type mockRepository struct {
	stored []normalizer.NormalizedEvent
	err    error
}

func (m *mockRepository) StoreSnapshot(ctx context.Context, event normalizer.NormalizedEvent) error {
	if m.err != nil {
		return m.err
	}
	m.stored = append(m.stored, event)
	return nil
}

type mockRateLimiter struct {
	waitErr error
}

func (m *mockRateLimiter) Wait(ctx context.Context) error {
	return m.waitErr
}

type failingFetcher struct {
	attemptsFail int
	attempts     int
	successData  []oddsapi.Odds
}

func (f *failingFetcher) FetchOdds(ctx context.Context, sport string, regions, markets []string, oddsFormat, dateFormat string) ([]oddsapi.Odds, error) {
	f.attempts++
	if f.attempts <= f.attemptsFail {
		return nil, fmt.Errorf("temporary failure")
	}
	return f.successData, nil
}
