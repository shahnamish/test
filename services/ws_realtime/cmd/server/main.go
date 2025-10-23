package main

import (
    "context"
    "log"
    "os"
    "os/signal"
    "syscall"

    "github.com/enterprise/ws-realtime/internal/auth"
    "github.com/enterprise/ws-realtime/internal/broker"
    "github.com/enterprise/ws-realtime/internal/config"
    "github.com/enterprise/ws-realtime/internal/hub"
    httpserver "github.com/enterprise/ws-realtime/internal/http"
)

func main() {
    logger := log.New(os.Stdout, "[ws-realtime] ", log.LstdFlags|log.Lmicroseconds)

    cfg, err := config.Load()
    if err != nil {
        logger.Fatalf("failed to load configuration: %v", err)
    }

    authenticator, err := auth.New(cfg.AuthSecret)
    if err != nil {
        logger.Fatalf("failed to initialize authenticator: %v", err)
    }

    svcCtx, stop := signal.NotifyContext(context.Background(), syscall.SIGINT, syscall.SIGTERM)
    defer stop()

    eventHub := hub.New(cfg.KafkaTopics, logger)
    hubCtx, hubCancel := context.WithCancel(svcCtx)
    defer hubCancel()
    go eventHub.Run(hubCtx)

    dispatcher := func(ctx context.Context, event broker.Event) {
        eventHub.Publish(hub.BroadcastMessage{
            Channel:   event.Topic,
            Payload:   event.Value,
            Timestamp: event.Timestamp,
        })
    }

    consumer := broker.NewConsumer(cfg.KafkaBrokers, cfg.KafkaGroupID, cfg.KafkaTopics, dispatcher, logger)

    consumerDone := make(chan struct{})
    go func() {
        consumer.Start(svcCtx)
        close(consumerDone)
    }()

    server := httpserver.New(cfg.BindAddress, eventHub, authenticator, cfg.AllowedOrigins, cfg.ClientBuffer, logger)

    logger.Printf("starting WebSocket server on %s", cfg.BindAddress)
    if err := server.Start(svcCtx); err != nil {
        logger.Printf("http server exited with error: %v", err)
    }

    // Begin coordinated shutdown.
    stop()
    hubCancel()

    shutdownCtx, cancel := context.WithTimeout(context.Background(), cfg.ShutdownTimeout)
    defer cancel()

    consumer.Close()

    select {
    case <-consumerDone:
    case <-shutdownCtx.Done():
        logger.Printf("timed out waiting for Kafka consumer shutdown: %v", shutdownCtx.Err())
    }

    logger.Println("shutdown complete")
}
