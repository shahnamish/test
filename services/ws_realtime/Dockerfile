# syntax=docker/dockerfile:1

FROM golang:1.21-alpine AS builder
WORKDIR /src

COPY go.mod go.sum ./
RUN go mod download

COPY . .
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -o /out/ws-realtime ./cmd/server

FROM gcr.io/distroless/base-debian12:nonroot
WORKDIR /opt/app
COPY --from=builder /out/ws-realtime ./ws-realtime
USER nonroot
EXPOSE 8080
ENTRYPOINT ["./ws-realtime"]
