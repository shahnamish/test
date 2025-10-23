package normalizer

import (
	"time"

	"github.com/betting/odds-ingest/internal/oddsapi"
)

// NormalizedOutcome represents a normalized betting outcome.
type NormalizedOutcome struct {
	Name       string    `json:"name"`
	Price      float64   `json:"price"`
	Point      float64   `json:"point,omitempty"`
	LastUpdate time.Time `json:"last_update"`
}

// NormalizedMarket represents a normalized market across bookmakers.
type NormalizedMarket struct {
	Key        string               `json:"key"`
	Bookmaker  string               `json:"bookmaker"`
	LastUpdate time.Time            `json:"last_update"`
	Outcomes   []NormalizedOutcome  `json:"outcomes"`
}

// NormalizedEvent represents normalized odds data for persistence and publishing.
type NormalizedEvent struct {
	EventID      string             `json:"event_id"`
	SportKey     string             `json:"sport_key"`
	SportTitle   string             `json:"sport_title"`
	CommenceTime time.Time          `json:"commence_time"`
	HomeTeam     string             `json:"home_team"`
	AwayTeam     string             `json:"away_team"`
	Markets      []NormalizedMarket `json:"markets"`
	RetrievedAt  time.Time          `json:"retrieved_at"`
}

// Normalizer transforms raw odds into NormalizedEvent payloads.
type Normalizer struct{}

// New creates a new Normalizer instance.
func New() *Normalizer {
	return &Normalizer{}
}

// Normalize converts raw odds into NormalizedEvent structures.
func (n *Normalizer) Normalize(raw oddsapi.Odds, retrievedAt time.Time) NormalizedEvent {
	markets := make([]NormalizedMarket, 0, len(raw.Bookmakers))
	for _, book := range raw.Bookmakers {
		lastUpdate := parseTime(book.LastUpdate)
		for _, market := range book.Markets {
			marketUpdate := parseTime(market.LastUpdate)
			outcomes := make([]NormalizedOutcome, 0, len(market.Outcomes))
			for _, outcome := range market.Outcomes {
				outcomes = append(outcomes, NormalizedOutcome{
					Name:       outcome.Name,
					Price:      outcome.Price,
					Point:      outcome.Point,
					LastUpdate: lastUpdate,
				})
			}
			markets = append(markets, NormalizedMarket{
				Key:        market.Key,
				Bookmaker:  book.Key,
				LastUpdate: marketUpdate,
				Outcomes:   outcomes,
			})
		}
	}

	return NormalizedEvent{
		EventID:      raw.ID,
		SportKey:     raw.SportKey,
		SportTitle:   raw.SportTitle,
		CommenceTime: parseTime(raw.CommenceTime),
		HomeTeam:     raw.HomeTeam,
		AwayTeam:     raw.AwayTeam,
		Markets:      markets,
		RetrievedAt:  retrievedAt.UTC(),
	}
}

func parseTime(value string) time.Time {
	if value == "" {
		return time.Time{}
	}
	t, err := time.Parse(time.RFC3339, value)
	if err != nil {
		return time.Time{}
	}
	return t.UTC()
}
