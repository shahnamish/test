package normalizer_test

import (
	"testing"
	"time"

	"github.com/betting/odds-ingest/internal/normalizer"
	"github.com/betting/odds-ingest/internal/oddsapi"
)

func TestNormalize(t *testing.T) {
	n := normalizer.New()
	retrievedAt := time.Date(2024, 10, 23, 12, 0, 0, 0, time.UTC)

	raw := oddsapi.Odds{
		ID:           "game1",
		SportKey:     "basketball_nba",
		SportTitle:   "NBA",
		CommenceTime: "2024-10-23T20:00:00Z",
		HomeTeam:     "Lakers",
		AwayTeam:     "Warriors",
		Bookmakers: []oddsapi.Bookmaker{
			{
				Key:        "bet365",
				Title:      "Bet 365",
				LastUpdate: "2024-10-23T10:00:00Z",
				Markets: []oddsapi.Market{
					{
						Key:        "h2h",
						LastUpdate: "2024-10-23T10:05:00Z",
						Outcomes: []oddsapi.Outcome{
							{Name: "Lakers", Price: 1.9},
							{Name: "Warriors", Price: 2.1},
						},
					},
				},
			},
		},
	}

	result := n.Normalize(raw, retrievedAt)

	if result.EventID != raw.ID {
		t.Fatalf("expected event id %s, got %s", raw.ID, result.EventID)
	}
	if len(result.Markets) != 1 {
		t.Fatalf("expected 1 market, got %d", len(result.Markets))
	}
	market := result.Markets[0]
	if market.Bookmaker != "bet365" {
		t.Fatalf("expected bookmaker bet365, got %s", market.Bookmaker)
	}
	if len(market.Outcomes) != 2 {
		t.Fatalf("expected 2 outcomes, got %d", len(market.Outcomes))
	}
	if market.Outcomes[0].Name != "Lakers" {
		t.Errorf("expected first outcome Lakers, got %s", market.Outcomes[0].Name)
	}
	if !market.LastUpdate.Equal(time.Date(2024, 10, 23, 10, 5, 0, 0, time.UTC)) {
		t.Errorf("unexpected market last update")
	}
	if !result.RetrievedAt.Equal(retrievedAt) {
		t.Errorf("expected retrievedAt %v, got %v", retrievedAt, result.RetrievedAt)
	}
}
