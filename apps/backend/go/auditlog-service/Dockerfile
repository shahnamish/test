# syntax=docker/dockerfile:1.4
FROM golang:1.21-alpine AS builder

WORKDIR /app
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build -o auditlog-service cmd/server/main.go

FROM gcr.io/distroless/base-debian12
WORKDIR /app
COPY --from=builder /app/auditlog-service ./auditlog-service
ENV AUDITLOG_SERVICE_PORT=8080
EXPOSE 8080
ENTRYPOINT ["./auditlog-service"]
