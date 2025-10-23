# WebSocket Real-Time Distribution Service Runbook

## Overview

The WebSocket real-time distribution service bridges Kafka topics to connected
clients over WebSockets. It supports the following stream types out of the box:

- `lines`
- `order_book`
- `analytics`

Authentication is enforced via HMAC-signed JWTs and per-client backpressure
limits guarantee platform stability under bursty traffic conditions.

## Architecture

```
Kafka (lines/order_book/analytics)
          │
          ▼
   Kafka Consumer (group: ws-realtime)
          │
          ▼
   Hub (channel router, backpressure, subscriptions)
          │
          ▼
   WebSocket server (JWT auth, channel control)
```

Key components:

- **Kafka Consumer** (`internal/broker`): Wires each topic to the hub's
  dispatcher and commits offsets after successful delivery to the hub.
- **Hub** (`internal/hub`): Tracks client/channel relationships, performs JSON
  fan-out, and disconnects slow consumers when their buffers fill.
- **HTTP Gateway** (`internal/http`): Manages authentication, WebSocket
  upgrades, and exposes a `/healthz` probe for readiness/liveness checks.

## Configuration

Configuration is sourced from environment variables (see
`internal/config/config.go`). Common variables include:

| Variable | Description | Default |
| --- | --- | --- |
| `WS_BIND_ADDRESS` | Listen address for the HTTP server | `:8080` |
| `WS_KAFKA_BROKERS` | Comma-separated broker list | `localhost:9092` |
| `WS_KAFKA_GROUP_ID` | Consumer group id | `ws-realtime` |
| `WS_KAFKA_TOPICS` | CSV list of topics to subscribe | `lines,order_book,analytics` |
| `WS_AUTH_SECRET` | HMAC secret for JWT validation | _required_ |
| `WS_ALLOWED_ORIGINS` | Optional CORS/Origin allow list | _(all origins)_ |
| `WS_CLIENT_BUFFER` | Per-client outbound queue size | `256` |
| `WS_SHUTDOWN_TIMEOUT_SECONDS` | Graceful shutdown timeout | `10` |

## Authentication

Clients must present a JWT signed with `WS_AUTH_SECRET`. Tokens are accepted
via either a `Bearer` Authorization header or the `token` query parameter. Only
the subject (`sub`) claim is required; optional `exp`, `iat`, and `aud` values
are honoured using the default JWT validations.

To generate tokens for testing, use the helper script:

```bash
python scripts/ws_realtime/generate_token.py $WS_AUTH_SECRET testing-user
```

## Backpressure Handling

Each connection receives a bounded outbound channel (`WS_CLIENT_BUFFER` entries).
If the queue is full when a message is published, the service disconnects the
client with a `policy violation` close frame and logs the event. Adjust
`WS_CLIENT_BUFFER` if legitimate users experience disconnects, but prefer
scaling out replicas first to increase total capacity.

## Scaling Guidance

- **Horizontal scaling**: Increase the number of deployment replicas. The
  service coordinates via Kafka consumer groups, so messages will be balanced
  evenly across replicas.
- **Vertical scaling**: Increase CPU for heavy JSON serialization workloads
  and memory when simultaneously serving thousands of clients.
- **Kafka partitions**: Ensure each topic has sufficient partitions to feed all
  replicas. The consumer runs one goroutine per topic per replica.

## Observability

- **Health checks**: `/healthz` responds with `{"status":"ok"}` when the
  service is ready to accept traffic.
- **Logging**: Connection lifecycle events, subscription requests, and
  backpressure drops are logged with the `[ws-realtime]` prefix.
- **Future work**: Wire into Prometheus by exporting metrics from the hub (see
  `internal/hub/hub.go` for extension points).

## Load Testing

Use the bundled k6 script to stress-test the gateway.

```bash
# 1. Launch dependencies
WS_TOKEN=$(python scripts/ws_realtime/generate_token.py dev-secret load-test)
WS_URL=ws://localhost:8080/ws \
WS_TOKEN=$WS_TOKEN \
k6 run tests/load/ws_realtime_k6.js
```

The script records connection failures, message throughput, and basic latency
estimates for received updates.

## Deployment

- **Docker Compose**: `docker-compose up ws-realtime`
- **Kubernetes**: Apply manifests under `infrastructure/kubernetes/ws-realtime`
  to provision `ConfigMap`, `Secret`, `Deployment`, and `Service` resources.
- **Image build**: `docker build -t ghcr.io/<org>/ws-realtime services/ws_realtime`

Remember to rotate the `WS_AUTH_SECRET` regularly and keep it out of source
control (the checked-in manifests use a placeholder value).

## Troubleshooting

| Symptom | Potential Cause | Mitigation |
| --- | --- | --- |
| Client receives `policy violation` close | Client cannot keep up with message rate | Increase replicas, optimise consumer, or raise `WS_CLIENT_BUFFER` cautiously |
| 401 on connect | Missing/invalid JWT | Issue valid token or correct secret |
| No messages delivered | Kafka topic empty or misconfigured | Verify topic names and broker connectivity |
| Slow shutdown | Consumer lag or stuck goroutine | Inspect logs; increase shutdown timeout |

Escalate incidents via the on-call rotation documented in the main security
runbook if they cannot be resolved using the above guidance.
