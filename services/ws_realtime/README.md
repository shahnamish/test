# WebSocket Real-Time Distribution Service

This service delivers low-latency market updates (lines, order book, and
analytics streams) to authenticated WebSocket clients. Messages are ingested
from Kafka topics and multiplexed to per-channel subscribers with built-in
backpressure controls.

## Features

- Kafka consumer group fan-out for `lines`, `order_book`, and `analytics`
- WebSocket gateway with JWT-based authentication (HS256)
- Per-client subscription management (`subscribe`/`unsubscribe` messages)
- Backpressure handling that disconnects slow consumers before exhausting memory
- Graceful shutdown with configurable timeout

## Configuration

Environment variables are documented in `internal/config/config.go`. The most
important settings are:

| Variable | Description |
| --- | --- |
| `WS_AUTH_SECRET` | HMAC secret used to validate client JWTs |
| `WS_KAFKA_BROKERS` | Comma-separated Kafka broker list |
| `WS_KAFKA_TOPICS` | Topics to forward to clients |
| `WS_CLIENT_BUFFER` | Per-connection outbound queue length |
| `WS_ALLOWED_ORIGINS` | Optional Origin allow list for browsers |

## Local Development

```bash
# Sync dependencies (generates go.sum if needed)
cd services/ws_realtime
go mod tidy

# Build and run via Docker Compose (from repository root)
cd ../..
WS_TOKEN=$(python scripts/ws_realtime/generate_token.py dev-secret tester)
docker-compose up ws-realtime

# Connect from a REPL
node -e "const WebSocket=require('ws'); const ws=new WebSocket('ws://localhost:8080/ws?token=${WS_TOKEN}'); ws.on('open',()=>ws.send(JSON.stringify({type:'subscribe',channels:['lines']}))); ws.on('message',data=>console.log(data.toString()));"
```

## Building the Container

```bash
docker build -t ghcr.io/example/ws-realtime .
```

## Testing

```bash
# Go unit tests
cd services/ws_realtime
go test ./...

# Load testing (requires k6)
WS_TOKEN=$(python ../../scripts/ws_realtime/generate_token.py dev-secret load-test)
k6 run ../../tests/load/ws_realtime_k6.js --env WS_TOKEN=$WS_TOKEN --env WS_URL=ws://localhost:8080/ws
```

Operational guidance is documented in `../../docs/operations/ws-realtime-runbook.md`.
