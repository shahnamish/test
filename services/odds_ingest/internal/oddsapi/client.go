package oddsapi

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

// Client interacts with The Odds API.
type Client struct {
	baseURL    string
	apiKey     string
	httpClient *http.Client
}

// NewClient constructs a new Odds API client.
func NewClient(baseURL, apiKey string) *Client {
	return &Client{
		baseURL: baseURL,
		apiKey:  apiKey,
		httpClient: &http.Client{
			Timeout: 15 * time.Second,
		},
	}
}

// Odds represents raw odds data from The Odds API.
type Odds struct {
	ID           string       `json:"id"`
	SportKey     string       `json:"sport_key"`
	SportTitle   string       `json:"sport_title"`
	CommenceTime string       `json:"commence_time"`
	HomeTeam     string       `json:"home_team"`
	AwayTeam     string       `json:"away_team"`
	Bookmakers   []Bookmaker  `json:"bookmakers"`
}

// Bookmaker represents a bookmaker within the odds response.
type Bookmaker struct {
	Key        string    `json:"key"`
	Title      string    `json:"title"`
	LastUpdate string    `json:"last_update"`
	Markets    []Market  `json:"markets"`
}

// Market represents a betting market.
type Market struct {
	Key        string    `json:"key"`
	LastUpdate string    `json:"last_update"`
	Outcomes   []Outcome `json:"outcomes"`
}

// Outcome represents an outcome within a market.
type Outcome struct {
	Name  string  `json:"name"`
	Price float64 `json:"price"`
	Point float64 `json:"point,omitempty"`
}

// FetchOdds retrieves odds for a specific sport from The Odds API.
func (c *Client) FetchOdds(ctx context.Context, sport string, regions, markets []string, oddsFormat, dateFormat string) ([]Odds, error) {
	endpoint := fmt.Sprintf("%s/sports/%s/odds", c.baseURL, sport)
	params := url.Values{}
	params.Add("apiKey", c.apiKey)

	if len(regions) > 0 {
		params.Add("regions", strings.Join(regions, ","))
	}
	if len(markets) > 0 {
		params.Add("markets", strings.Join(markets, ","))
	}
	if oddsFormat != "" {
		params.Add("oddsFormat", oddsFormat)
	}
	if dateFormat != "" {
		params.Add("dateFormat", dateFormat)
	}

	fullURL := fmt.Sprintf("%s?%s", endpoint, params.Encode())

	req, err := http.NewRequestWithContext(ctx, http.MethodGet, fullURL, nil)
	if err != nil {
		return nil, fmt.Errorf("failed to build request: %w", err)
	}

	resp, err := c.httpClient.Do(req)
	if err != nil {
		return nil, fmt.Errorf("HTTP GET failed: %w", err)
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response body: %w", err)
	}

	if resp.StatusCode == http.StatusTooManyRequests {
		return nil, fmt.Errorf("rate limit exceeded: status %d", resp.StatusCode)
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d, body: %s", resp.StatusCode, string(body))
	}

	var odds []Odds
	if err := json.Unmarshal(body, &odds); err != nil {
		return nil, fmt.Errorf("failed to parse JSON: %w", err)
	}

	return odds, nil
}
