package config

import (
    "errors"
    "fmt"
    "os"
    "strconv"
    "strings"
    "time"
)

// Config encapsulates runtime configuration for the WebSocket distribution service.
type Config struct {
    KafkaBrokers    []string
    KafkaGroupID    string
    KafkaTopics     []string
    BindAddress     string
    AuthSecret      string
    AllowedOrigins  []string
    ClientBuffer    int
    ShutdownTimeout time.Duration
}

// Load resolves configuration values from environment variables and applies sensible defaults.
func Load() (Config, error) {
    cfg := Config{
        BindAddress:     getEnv("WS_BIND_ADDRESS", ":8080"),
        KafkaGroupID:    getEnv("WS_KAFKA_GROUP_ID", "ws-realtime"),
        KafkaTopics:     splitAndTrim(getEnv("WS_KAFKA_TOPICS", "lines,order_book,analytics")),
        AllowedOrigins:  splitAndTrim(os.Getenv("WS_ALLOWED_ORIGINS")),
        AuthSecret:      os.Getenv("WS_AUTH_SECRET"),
        ShutdownTimeout: 10 * time.Second,
    }

    brokers := splitAndTrim(getEnv("WS_KAFKA_BROKERS", "localhost:9092"))
    if len(brokers) == 0 {
        return Config{}, errors.New("WS_KAFKA_BROKERS must be provided")
    }
    cfg.KafkaBrokers = brokers

    if cfg.AuthSecret == "" {
        return Config{}, errors.New("WS_AUTH_SECRET must be provided")
    }

    if timeout := os.Getenv("WS_SHUTDOWN_TIMEOUT_SECONDS"); timeout != "" {
        tSeconds, err := strconv.Atoi(timeout)
        if err != nil || tSeconds <= 0 {
            return Config{}, fmt.Errorf("invalid WS_SHUTDOWN_TIMEOUT_SECONDS: %w", err)
        }
        cfg.ShutdownTimeout = time.Duration(tSeconds) * time.Second
    }

    bufferSizeStr := getEnv("WS_CLIENT_BUFFER", "256")
    bufferSize, err := strconv.Atoi(bufferSizeStr)
    if err != nil || bufferSize <= 0 {
        return Config{}, fmt.Errorf("invalid WS_CLIENT_BUFFER value %q", bufferSizeStr)
    }
    cfg.ClientBuffer = bufferSize

    return cfg, nil
}

func getEnv(name, fallback string) string {
    if value, ok := os.LookupEnv(name); ok && strings.TrimSpace(value) != "" {
        return value
    }
    return fallback
}

func splitAndTrim(raw string) []string {
    if strings.TrimSpace(raw) == "" {
        return nil
    }
    parts := strings.Split(raw, ",")
    result := make([]string, 0, len(parts))
    for _, part := range parts {
        value := strings.TrimSpace(part)
        if value != "" {
            result = append(result, value)
        }
    }
    return result
}
