package oddsapi_test

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/betting/odds-ingest/internal/oddsapi"
)

func TestFetchOdds_Success(t *testing.T) {
	stubData := []oddsapi.Odds{
		{
			ID:           "event1",
			SportKey:     "soccer_epl",
			SportTitle:   "English Premier League",
			CommenceTime: "2024-10-23T15:00:00Z",
			HomeTeam:     "Arsenal",
			AwayTeam:     "Chelsea",
			Bookmakers: []oddsapi.Bookmaker{
				{
					Key:        "draftkings",
					Title:      "DraftKings",
					LastUpdate: "2024-10-23T12:00:00Z",
					Markets: []oddsapi.Market{
						{
							Key:        "h2h",
							LastUpdate: "2024-10-23T12:00:00Z",
							Outcomes: []oddsapi.Outcome{
								{Name: "Arsenal", Price: 1.75},
								{Name: "Chelsea", Price: 2.10},
								{Name: "Draw", Price: 3.50},
							},
						},
					},
				},
			},
		},
	}

	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Query().Get("apiKey") == "" {
			t.Error("expected apiKey in query parameters")
		}
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(stubData)
	}))
	defer server.Close()

	client := oddsapi.NewClient(server.URL, "test-api-key")

	ctx := context.Background()
	odds, err := client.FetchOdds(ctx, "soccer_epl", []string{"us"}, []string{"h2h"}, "decimal", "iso")

	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if len(odds) != 1 {
		t.Fatalf("expected 1 odds entry, got %d", len(odds))
	}

	if odds[0].ID != "event1" {
		t.Errorf("expected ID=event1, got %s", odds[0].ID)
	}
	if odds[0].HomeTeam != "Arsenal" {
		t.Errorf("expected home=Arsenal, got %s", odds[0].HomeTeam)
	}
}

func TestFetchOdds_RateLimited(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTooManyRequests)
	}))
	defer server.Close()

	client := oddsapi.NewClient(server.URL, "test-api-key")

	ctx := context.Background()
	_, err := client.FetchOdds(ctx, "soccer_epl", nil, nil, "", "")

	if err == nil {
		t.Fatal("expected error for rate limit, got nil")
	}
}

func TestFetchOdds_BadResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte("Bad Request"))
	}))
	defer server.Close()

	client := oddsapi.NewClient(server.URL, "test-api-key")

	ctx := context.Background()
	_, err := client.FetchOdds(ctx, "soccer_epl", nil, nil, "", "")

	if err == nil {
		t.Fatal("expected error for bad request, got nil")
	}
}
