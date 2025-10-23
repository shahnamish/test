# Portfolio and Order Management Service

A Go-based microservice for managing bet placements, tracking open positions, settlements, and performance metrics. Built with PostgreSQL for persistence, Kafka for event streaming, and provides both REST and gRPC interfaces.

## Features

- **Order Management**: Place and settle bets with comprehensive validation
- **Position Tracking**: Real-time exposure and PnL tracking for each market/selection
- **Performance Metrics**: Aggregated ROI, total stake, payout, and win rate statistics
- **Analytics Integration**: Consume analytics insights from Kafka for informed bet placement
- **Event Publishing**: Emit order and position events to Kafka for downstream consumers
- **Dual Protocol Support**: REST (HTTP/JSON) and gRPC interfaces
- **Business Rules**: Validate stakes, odds, and order sides with business logic
- **Comprehensive Testing**: Unit tests with >80% coverage

## Architecture

```
services/portfolio/
├── cmd/
│   └── server/           # Main application entry point
│       └── main.go
├── internal/
│   ├── portfolio/        # Core business logic
│   │   ├── models.go     # Domain models and types
│   │   ├── repository.go # Data persistence layer
│   │   ├── service.go    # Business logic and orchestration
│   │   ├── kafka_producer.go  # Event publishing
│   │   ├── analytics.go  # Analytics client
│   │   ├── errors.go     # Custom error types
│   │   └── service_test.go    # Unit tests
│   ├── httpapi/          # REST API layer
│   │   ├── handler.go    # HTTP handlers
│   │   └── handler_test.go
│   └── grpcapi/          # gRPC API layer
│       ├── server.go     # gRPC server
│       └── types.go      # Protocol definitions
├── Dockerfile            # Container image definition
├── go.mod                # Go module definition
└── README.md
```

## Technology Stack

- **Language**: Go 1.21+
- **Web Framework**: Gin (REST API)
- **Database**: PostgreSQL with lib/pq driver
- **Message Broker**: Apache Kafka (segmentio/kafka-go)
- **RPC**: gRPC with JSON codec
- **Observability**: Prometheus metrics, Zap structured logging
- **Testing**: testify for assertions and mocks

## Getting Started

### Prerequisites

- Go 1.21 or higher
- PostgreSQL 12+ running locally or via Docker
- Apache Kafka running locally or via Docker
- Docker (optional, for containerized deployment)

### Installation

1. Navigate to the service directory:
```bash
cd services/portfolio
```

2. Install dependencies:
```bash
go mod download
```

3. Set up environment variables (optional, defaults provided):
```bash
export DATABASE_URL="postgres://postgres:postgres@localhost:5432/portfolio?sslmode=disable"
export KAFKA_BROKER="localhost:9092"
export KAFKA_TOPIC="portfolio-events"
export ANALYTICS_TOPIC="analytics-insights"
export HTTP_PORT="8080"
export GRPC_PORT="9090"
```

### Running the Service

#### Local Development

```bash
go run cmd/server/main.go
```

#### Using Docker

Build the image:
```bash
docker build -t portfolio-service:latest .
```

Run the container:
```bash
docker run -p 8080:8080 -p 9090:9090 \
  -e DATABASE_URL="postgres://postgres:postgres@host.docker.internal:5432/portfolio?sslmode=disable" \
  -e KAFKA_BROKER="host.docker.internal:9092" \
  portfolio-service:latest
```

## API Documentation

### REST API Endpoints

All endpoints are prefixed with `/api/v1`.

#### Place Order
```http
POST /api/v1/orders
Content-Type: application/json

{
  "user_id": "user123",
  "market_id": "market456",
  "selection_id": "selection789",
  "side": "BACK",
  "stake": 100.0,
  "odds": 2.5
}
```

Response:
```json
{
  "Order": {
    "id": "uuid",
    "user_id": "user123",
    "market_id": "market456",
    "selection_id": "selection789",
    "side": "BACK",
    "stake": 100.0,
    "odds": 2.5,
    "status": "OPEN",
    "payout": 0,
    "created_at": "2024-01-01T00:00:00Z"
  },
  "Position": {
    "user_id": "user123",
    "market_id": "market456",
    "selection_id": "selection789",
    "side": "BACK",
    "exposure": 100.0,
    "pnl": 0,
    "updated_at": "2024-01-01T00:00:00Z"
  },
  "Insight": {
    "market_id": "market456",
    "selection_id": "selection789",
    "implied_probability": 0.4,
    "expected_value": 1.05,
    "momentum": 0.02
  }
}
```

#### Settle Order
```http
POST /api/v1/orders/{order_id}/settle
Content-Type: application/json

{
  "won": true,
  "payout": 250.0
}
```

#### Get Open Orders
```http
GET /api/v1/orders/open/{user_id}
```

#### Get Positions
```http
GET /api/v1/positions/{user_id}
```

#### Get Performance Metrics
```http
GET /api/v1/metrics/{user_id}
```

Response:
```json
{
  "total_stake": 500.0,
  "total_payout": 750.0,
  "roi": 50.0,
  "orders_placed": 10,
  "orders_won": 6
}
```

### gRPC API

The gRPC service exposes methods matching the REST endpoints:
- `PlaceOrder`
- `SettleOrder`
- `ListOpenPositions`
- `GetPerformanceMetrics`

The service uses a JSON codec for flexible message encoding.

## Business Rules

### Order Placement
- Stake must be greater than 0
- Odds must be greater than 1.0
- Side must be either "BACK" or "LAY"
- Exposure for LAY bets is calculated as: `stake * (odds - 1)`
- Exposure for BACK bets is: `stake`

### Order Settlement
- Only OPEN orders can be settled
- Winning bets receive the specified payout
- Losing bets receive 0 payout
- Position PnL is updated with: `payout - stake`

## Database Schema

### orders
```sql
CREATE TABLE orders (
    id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    market_id VARCHAR(255) NOT NULL,
    selection_id VARCHAR(255) NOT NULL,
    side VARCHAR(50) NOT NULL,
    stake NUMERIC(20, 2) NOT NULL,
    odds NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL,
    payout NUMERIC(20, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    settled_at TIMESTAMP
);
```

### positions
```sql
CREATE TABLE positions (
    user_id VARCHAR(255) NOT NULL,
    market_id VARCHAR(255) NOT NULL,
    selection_id VARCHAR(255) NOT NULL,
    side VARCHAR(50) NOT NULL,
    exposure NUMERIC(20, 2) NOT NULL DEFAULT 0,
    pnl NUMERIC(20, 2) NOT NULL DEFAULT 0,
    updated_at TIMESTAMP NOT NULL,
    PRIMARY KEY (user_id, market_id, selection_id)
);
```

## Kafka Events

### Published Events

The service publishes events to the configured Kafka topic:

#### order.placed
```json
{
  "type": "order.placed",
  "timestamp": 1704067200,
  "payload": {
    "id": "uuid",
    "user_id": "user123",
    "market_id": "market456",
    "selection_id": "selection789",
    "side": "BACK",
    "stake": 100.0,
    "odds": 2.5,
    "status": "OPEN"
  }
}
```

#### order.settled
```json
{
  "type": "order.settled",
  "timestamp": 1704067200,
  "payload": {
    "id": "uuid",
    "status": "SETTLED",
    "payout": 250.0,
    "settled_at": "2024-01-01T00:00:00Z"
  }
}
```

#### position.updated
```json
{
  "type": "position.updated",
  "timestamp": 1704067200,
  "payload": {
    "user_id": "user123",
    "market_id": "market456",
    "selection_id": "selection789",
    "exposure": 100.0,
    "pnl": 150.0
  }
}
```

### Consumed Events

The service consumes analytics insights from the configured analytics topic.

## Testing

Run all tests:
```bash
go test ./... -v
```

Run tests with coverage:
```bash
go test ./... -cover -coverprofile=coverage.out
go tool cover -html=coverage.out
```

Run specific test package:
```bash
go test ./internal/portfolio -v
```

## Monitoring

### Health Check
```http
GET /health
```

### Prometheus Metrics
```http
GET /metrics
```

Standard Gin and Go runtime metrics are exposed.

## Development

### Project Structure
- `cmd/`: Application entry points
- `internal/`: Private application code
  - `portfolio/`: Core domain logic (repository, service, models)
  - `httpapi/`: REST API layer
  - `grpcapi/`: gRPC API layer
- `pkg/`: Public library code (currently empty, reserved for shared utilities)

### Adding New Features
1. Define domain models in `internal/portfolio/models.go`
2. Update repository interface and implementation
3. Implement business logic in service layer
4. Add REST handlers in `httpapi/handler.go`
5. Add gRPC handlers in `grpcapi/server.go`
6. Write comprehensive unit tests

## Configuration

The service is configured via environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgres://postgres:postgres@localhost:5432/portfolio?sslmode=disable` | PostgreSQL connection string |
| `KAFKA_BROKER` | `localhost:9092` | Kafka broker address |
| `KAFKA_TOPIC` | `portfolio-events` | Topic for publishing events |
| `ANALYTICS_TOPIC` | `analytics-insights` | Topic for consuming analytics |
| `HTTP_PORT` | `8080` | HTTP server port |
| `GRPC_PORT` | `9090` | gRPC server port |

## License

Copyright (c) 2024. All rights reserved.
