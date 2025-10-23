package config_test

import (
	"os"
	"testing"

	"github.com/betting/odds-ingest/internal/config"
)

func TestLoadConfig_MissingAPIKey(t *testing.T) {
	os.Clearenv()
	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error when ODDS_API_KEY is missing")
	}
}

func TestLoadConfig_ValidEnv(t *testing.T) {
	os.Clearenv()
	os.Setenv("ODDS_API_KEY", "test-key-12345")
	os.Setenv("ODDS_SPORTS", "soccer_epl,basketball_nba")
	os.Setenv("ODDS_REGIONS", "us,uk")
	os.Setenv("ODDS_MARKETS", "h2h,spreads")
	os.Setenv("ODDS_RPM", "50")

	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("expected no error, got: %v", err)
	}

	if cfg.APIKey != "test-key-12345" {
		t.Errorf("expected API key 'test-key-12345', got %s", cfg.APIKey)
	}
	if len(cfg.Sports) != 2 {
		t.Errorf("expected 2 sports, got %d", len(cfg.Sports))
	}
	if cfg.Sports[0] != "soccer_epl" {
		t.Errorf("expected first sport soccer_epl, got %s", cfg.Sports[0])
	}
	if len(cfg.Regions) != 2 {
		t.Errorf("expected 2 regions, got %d", len(cfg.Regions))
	}
	if len(cfg.Markets) != 2 {
		t.Errorf("expected 2 markets, got %d", len(cfg.Markets))
	}
	if cfg.Rate.RequestsPerMinute != 50 {
		t.Errorf("expected RPM 50, got %d", cfg.Rate.RequestsPerMinute)
	}
}

func TestLoadConfig_ZeroRPM(t *testing.T) {
	os.Clearenv()
	os.Setenv("ODDS_API_KEY", "test-key")
	os.Setenv("ODDS_RPM", "0")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error for zero RPM")
	}
}

func TestLoadConfig_NoSports(t *testing.T) {
	os.Clearenv()
	os.Setenv("ODDS_API_KEY", "test-key")
	os.Setenv("ODDS_SPORTS", "")

	_, err := config.Load()
	if err == nil {
		t.Fatal("expected error when no sports specified")
	}
}
