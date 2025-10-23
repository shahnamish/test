package main

import (
	"context"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"

	"github.com/betting/odds-ingest/internal/config"
	"github.com/betting/odds-ingest/internal/metrics"
	"github.com/betting/odds-ingest/internal/normalizer"
	"github.com/betting/odds-ingest/internal/oddsapi"
	"github.com/betting/odds-ingest/internal/producer"
	"github.com/betting/odds-ingest/internal/repository"
	"github.com/betting/odds-ingest/internal/service"
	"github.com/betting/odds-ingest/internal/throttle"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	metricRegistry := metrics.New()
	_ = metricRegistry // keep reference for completeness

	go func() {
		log.Printf("Starting metrics server at %s", cfg.Metrics.Address)
		if err := http.ListenAndServe(cfg.Metrics.Address, metrics.Handler()); err != nil {
			log.Fatalf("metrics server failed: %v", err)
		}
	}()

	apiClient := oddsapi.NewClient(cfg.APIBaseURL, cfg.APIKey)
	normalizer := normalizer.New()
	producer, err := producer.NewKafkaProducer(cfg.Kafka)
	if err != nil {
		log.Fatalf("unable to create Kafka producer: %v", err)
	}
	defer producer.Close()

	repo, err := repository.NewPostgresRepository(cfg.Postgres)
	if err != nil {
		log.Fatalf("unable to create repository: %v", err)
	}
	defer repo.Close()

	rateLimiter := throttle.NewRateLimiter(cfg.Rate.RequestsPerMinute)
	defer rateLimiter.Stop()

	ingestor := service.New(cfg, apiClient, normalizer, producer, repo, rateLimiter, metricRegistry)

	signalChan := make(chan os.Signal, 1)
	signal.Notify(signalChan, syscall.SIGINT, syscall.SIGTERM)

	go ingestServiceLoop(ctx, ingestor)

	sig := <-signalChan
	log.Printf("signal received: %s, shutting down", sig)
	cancel()
}

func ingestServiceLoop(ctx context.Context, ingestService *service.IngestService) {
	ingestService.Start(ctx)
}
