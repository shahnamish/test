# Odds Ingestion Service

A Go service that ingests real-time sports betting odds from The Odds API, normalizes the data, and publishes it to Kafka while storing snapshots in PostgreSQL.

## Features

- **Real-time Odds Ingestion**: Fetches odds from The Odds API at configurable intervals
- **Rate Limiting**: Built-in throttling to respect API rate limits
- **Retry Logic**: Exponential backoff for transient failures
- **Kafka Publishing**: Publishes normalized events to Kafka topics
- **PostgreSQL Storage**: Stores odds snapshots for historical analysis
- **Prometheus Metrics**: Exposes detailed operational metrics
- **Configurable**: Environment-based configuration for all settings

## Architecture

```
┌─────────────────┐
│  The Odds API   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   API Client    │  (with rate limiting & retries)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Normalizer    │
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌───────┐  ┌─────────┐
│ Kafka │  │Postgres │
└───────┘  └─────────┘
```

## Configuration

All configuration is managed via environment variables:

### The Odds API Configuration

- `ODDS_API_KEY` (required): Your API key from The Odds API
- `ODDS_API_BASE_URL`: Base URL for the API (default: `https://api.the-odds-api.com/v4`)
- `ODDS_SPORTS`: Comma-separated list of sport keys (default: `soccer_epl`)
- `ODDS_REGIONS`: Comma-separated list of regions (default: `us`)
- `ODDS_MARKETS`: Comma-separated list of markets (default: `h2h,spreads,totals`)
- `ODDS_FORMAT`: Odds format (default: `decimal`)
- `ODDS_DATE_FORMAT`: Date format (default: `iso`)
- `ODDS_FETCH_INTERVAL`: Interval between fetches (default: `30s`)

### Rate Limiting & Retry

- `ODDS_RPM`: Requests per minute (default: `30`)
- `ODDS_RETRY_ATTEMPTS`: Maximum retry attempts (default: `4`)
- `ODDS_RETRY_INITIAL_BACKOFF`: Initial backoff duration (default: `500ms`)
- `ODDS_RETRY_MAX_BACKOFF`: Maximum backoff duration (default: `5s`)

### Kafka Configuration

- `KAFKA_BROKERS`: Comma-separated list of Kafka brokers (default: `localhost:9092`)
- `KAFKA_TOPIC`: Topic for publishing odds (default: `odds.snapshots`)
- `KAFKA_CLIENT_ID`: Client ID for Kafka (default: `odds-ingest`)
- `KAFKA_TIMEOUT`: Connection timeout (default: `10s`)

### PostgreSQL Configuration

- `POSTGRES_DSN`: PostgreSQL connection string (default: `postgres://postgres:postgres@localhost:5432/odds?sslmode=disable`)
- `POSTGRES_SCHEMA`: Database schema (default: `public`)
- `POSTGRES_TABLE`: Table name for snapshots (default: `odds_snapshots`)
- `POSTGRES_HEALTH_QUERY`: Health check query (default: `SELECT 1`)

### Metrics Configuration

- `METRICS_ADDRESS`: Address for metrics endpoint (default: `:9095`)

## Building

```bash
cd services/odds_ingest
go build -o bin/odds-ingest ./cmd/odds-ingest
```

## Running

### Using Docker Compose

The service requires Kafka and PostgreSQL. Update `docker-compose.yml` in the project root to include:

```yaml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: odds
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"

  kafka:
    image: confluentinc/cp-kafka:7.5.0
    environment:
      KAFKA_BROKER_ID: 1
      KAFKA_ZOOKEEPER_CONNECT: zookeeper:2181
      KAFKA_ADVERTISED_LISTENERS: PLAINTEXT://kafka:9092
      KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR: 1
    ports:
      - "9092:9092"
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:7.5.0
    environment:
      ZOOKEEPER_CLIENT_PORT: 2181
    ports:
      - "2181:2181"
```

### Local Execution

```bash
export ODDS_API_KEY="your-api-key-here"
export ODDS_SPORTS="basketball_nba,soccer_epl"
export KAFKA_BROKERS="localhost:9092"
export POSTGRES_DSN="postgres://postgres:postgres@localhost:5432/odds?sslmode=disable"

./bin/odds-ingest
```

## Testing

Run unit tests:

```bash
go test ./...
```

Run tests with coverage:

```bash
go test -cover ./...
```

## Metrics

The service exposes Prometheus metrics at `http://localhost:9095/metrics`:

- `odds_ingest_requests_total`: Total API fetch attempts
- `odds_ingest_success_total`: Successful fetch operations
- `odds_ingest_failures_total`: Failed fetch operations
- `odds_ingest_kafka_success_total`: Successful Kafka publishes
- `odds_ingest_kafka_failures_total`: Failed Kafka publishes
- `odds_ingest_db_success_total`: Successful DB writes
- `odds_ingest_db_failures_total`: Failed DB writes
- `odds_ingest_last_poll_timestamp`: Last successful fetch timestamp
- `odds_ingest_repository_insert_seconds`: Histogram of DB insert durations

## Database Schema

The service automatically creates the following table:

```sql
CREATE TABLE IF NOT EXISTS public.odds_snapshots (
    id SERIAL PRIMARY KEY,
    event_id TEXT NOT NULL,
    sport_key TEXT NOT NULL,
    sport_title TEXT,
    commence_time TIMESTAMPTZ,
    home_team TEXT,
    away_team TEXT,
    payload JSONB NOT NULL,
    retrieved_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

## Kafka Message Format

Messages published to Kafka follow this JSON structure:

```json
{
  "event_id": "abc123",
  "sport_key": "basketball_nba",
  "sport_title": "NBA",
  "commence_time": "2024-10-23T20:00:00Z",
  "home_team": "Lakers",
  "away_team": "Warriors",
  "markets": [
    {
      "key": "h2h",
      "bookmaker": "draftkings",
      "last_update": "2024-10-23T12:00:00Z",
      "outcomes": [
        {
          "name": "Lakers",
          "price": 1.90,
          "point": 0,
          "last_update": "2024-10-23T12:00:00Z"
        }
      ]
    }
  ],
  "retrieved_at": "2024-10-23T12:05:00Z"
}
```

## Development

### Project Structure

```
.
├── cmd/
│   └── odds-ingest/        # Main entry point
│       └── main.go
├── internal/
│   ├── config/             # Configuration management
│   ├── metrics/            # Prometheus metrics
│   ├── normalizer/         # Data normalization
│   ├── oddsapi/            # The Odds API client
│   ├── producer/           # Kafka producer
│   ├── repository/         # PostgreSQL repository
│   ├── service/            # Core ingestion service
│   └── throttle/           # Rate limiting
├── go.mod
├── go.sum
└── README.md
```

### Adding New Sports

To add support for new sports, simply update the `ODDS_SPORTS` environment variable with the sport keys from The Odds API documentation.

### Extending Data Storage

The service stores complete normalized events in PostgreSQL's JSONB column for flexibility. To add custom queries or indexes:

```sql
CREATE INDEX idx_odds_event_id ON odds_snapshots(event_id);
CREATE INDEX idx_odds_sport_key ON odds_snapshots(sport_key);
CREATE INDEX idx_odds_retrieved_at ON odds_snapshots(retrieved_at DESC);
```

## Troubleshooting

### Rate Limit Errors

If you encounter rate limit errors, reduce `ODDS_RPM` or increase `ODDS_FETCH_INTERVAL`.

### Connection Errors

Ensure Kafka and PostgreSQL are accessible:

```bash
# Test PostgreSQL
psql $POSTGRES_DSN -c "SELECT 1"

# Test Kafka
kafka-topics --bootstrap-server localhost:9092 --list
```

### Memory Usage

For high-volume ingestion, adjust Go runtime settings:

```bash
GOMEMLIMIT=512MiB ./bin/odds-ingest
```

## License

Copyright (c) 2024. All rights reserved.
