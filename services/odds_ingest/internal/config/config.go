package config

import (
	"fmt"
	"os"
	"strconv"
	"strings"
	"time"
)

// Config encapsulates all runtime configuration values for the odds ingestion service.
type Config struct {
	APIBaseURL    string
	APIKey        string
	Sports        []string
	Regions       []string
	Markets       []string
	OddsFormat    string
	DateFormat    string
	FetchInterval time.Duration

	Kafka    KafkaConfig
	Postgres PostgresConfig
	Metrics  MetricsConfig
	Rate     RateLimitConfig
	Retry    RetryConfig
}

// KafkaConfig represents Kafka connectivity options.
type KafkaConfig struct {
	Brokers  []string
	Topic    string
	ClientID string
	Timeout  time.Duration
}

// PostgresConfig represents Postgres connectivity options.
type PostgresConfig struct {
	DSN              string
	Schema           string
	Table            string
	HealthCheckQuery string
}

// MetricsConfig configures the metrics HTTP server.
type MetricsConfig struct {
	Address string
}

// RateLimitConfig defines throttling characteristics towards The Odds API.
type RateLimitConfig struct {
	RequestsPerMinute int
}

// RetryConfig defines retry policy for HTTP calls to the upstream API.
type RetryConfig struct {
	MaxAttempts   int
	InitialBackoff time.Duration
	MaxBackoff     time.Duration
}

// Load reads environment variables and constructs a Config instance.
func Load() (Config, error) {
	cfg := Config{
		APIBaseURL:    getEnv("ODDS_API_BASE_URL", "https://api.the-odds-api.com/v4"),
		APIKey:        os.Getenv("ODDS_API_KEY"),
		Sports:        splitAndTrim(getEnv("ODDS_SPORTS", "soccer_epl")),
		Regions:       splitAndTrim(getEnv("ODDS_REGIONS", "us")),
		Markets:       splitAndTrim(getEnv("ODDS_MARKETS", "h2h,spreads,totals")),
		OddsFormat:    getEnv("ODDS_FORMAT", "decimal"),
		DateFormat:    getEnv("ODDS_DATE_FORMAT", "iso"),
		FetchInterval: getDuration("ODDS_FETCH_INTERVAL", 30*time.Second),
		Kafka: KafkaConfig{
			Brokers:  splitAndTrim(getEnv("KAFKA_BROKERS", "localhost:9092")),
			Topic:    getEnv("KAFKA_TOPIC", "odds.snapshots"),
			ClientID: getEnv("KAFKA_CLIENT_ID", "odds-ingest"),
			Timeout:  getDuration("KAFKA_TIMEOUT", 10*time.Second),
		},
		Postgres: PostgresConfig{
			DSN:              getEnv("POSTGRES_DSN", "postgres://postgres:postgres@localhost:5432/odds?sslmode=disable"),
			Schema:           getEnv("POSTGRES_SCHEMA", "public"),
			Table:            getEnv("POSTGRES_TABLE", "odds_snapshots"),
			HealthCheckQuery: getEnv("POSTGRES_HEALTH_QUERY", "SELECT 1"),
		},
		Metrics: MetricsConfig{
			Address: getEnv("METRICS_ADDRESS", ":9095"),
		},
		Rate: RateLimitConfig{
			RequestsPerMinute: getInt("ODDS_RPM", 30),
		},
		Retry: RetryConfig{
			MaxAttempts:    getInt("ODDS_RETRY_ATTEMPTS", 4),
			InitialBackoff: getDuration("ODDS_RETRY_INITIAL_BACKOFF", 500*time.Millisecond),
			MaxBackoff:     getDuration("ODDS_RETRY_MAX_BACKOFF", 5*time.Second),
		},
	}

	if cfg.APIKey == "" {
		return Config{}, fmt.Errorf("ODDS_API_KEY must be provided")
	}

	if cfg.Rate.RequestsPerMinute <= 0 {
		return Config{}, fmt.Errorf("ODDS_RPM must be greater than zero")
	}

	if len(cfg.Sports) == 0 {
		return Config{}, fmt.Errorf("ODDS_SPORTS must include at least one sport key")
	}

	return cfg, nil
}

func getEnv(key, fallback string) string {
	if value := strings.TrimSpace(os.Getenv(key)); value != "" {
		return value
	}
	return fallback
}

func splitAndTrim(input string) []string {
	parts := strings.Split(input, ",")
	var result []string
	for _, p := range parts {
		p = strings.TrimSpace(p)
		if p != "" {
			result = append(result, p)
		}
	}
	return result
}

func getDuration(key string, fallback time.Duration) time.Duration {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	d, err := time.ParseDuration(value)
	if err != nil {
		return fallback
	}
	return d
}

func getInt(key string, fallback int) int {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return fallback
	}
	i, err := strconv.Atoi(value)
	if err != nil {
		return fallback
	}
	return i
}
