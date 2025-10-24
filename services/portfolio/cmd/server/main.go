package main

import (
	"context"
	"database/sql"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	_ "github.com/lib/pq"
	"github.com/prometheus/client_golang/prometheus/promhttp"
	"go.uber.org/zap"
	"google.golang.org/grpc"

	"github.com/portfolio-service/internal/grpcapi"
	"github.com/portfolio-service/internal/httpapi"
	"github.com/portfolio-service/internal/portfolio"
)

func main() {
	logger, _ := zap.NewProduction()
	defer logger.Sync()

	cfg := loadConfig()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		logger.Fatal("failed to connect to database", zap.Error(err))
	}
	defer db.Close()

	if err := db.Ping(); err != nil {
		logger.Fatal("failed to ping database", zap.Error(err))
	}

	if err := createSchema(db); err != nil {
		logger.Fatal("failed to create schema", zap.Error(err))
	}

	repo := portfolio.NewPostgresRepository(db)

	kafkaProducer := portfolio.NewKafkaProducer(cfg.KafkaBrokers, cfg.KafkaTopic)
	defer kafkaProducer.Close()

	analyticsClient := portfolio.NewKafkaAnalyticsClient(cfg.KafkaBrokers, cfg.AnalyticsTopic, "portfolio-service")
	defer analyticsClient.Close()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	analyticsClient.Start(ctx)

	clock := portfolio.RealClock{}
	svc := portfolio.NewService(repo, kafkaProducer, analyticsClient, clock)

	httpServer := startHTTPServer(cfg, svc, logger)
	grpcServer := startGRPCServer(cfg, svc, logger)

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGTERM)

	<-sigChan
	logger.Info("shutting down gracefully")

	cancel()

	httpShutdown, httpCancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer httpCancel()
	if err := httpServer.Shutdown(httpShutdown); err != nil {
		logger.Error("http server shutdown error", zap.Error(err))
	}

	grpcServer.GracefulStop()
	logger.Info("shutdown complete")
}

type config struct {
	HTTPPort       string
	GRPCPort       string
	DatabaseURL    string
	KafkaBrokers   []string
	KafkaTopic     string
	AnalyticsTopic string
}

func loadConfig() config {
	return config{
		HTTPPort:       getEnv("HTTP_PORT", "8080"),
		GRPCPort:       getEnv("GRPC_PORT", "9090"),
		DatabaseURL:    getEnv("DATABASE_URL", "postgres://postgres:postgres@localhost:5432/portfolio?sslmode=disable"),
		KafkaBrokers:   []string{getEnv("KAFKA_BROKER", "localhost:9092")},
		KafkaTopic:     getEnv("KAFKA_TOPIC", "portfolio-events"),
		AnalyticsTopic: getEnv("ANALYTICS_TOPIC", "analytics-insights"),
	}
}

func getEnv(key, defaultValue string) string {
	if value, exists := os.LookupEnv(key); exists {
		return value
	}
	return defaultValue
}

func createSchema(db *sql.DB) error {
	schema := `
    CREATE TABLE IF NOT EXISTS orders (
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

    CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

    CREATE TABLE IF NOT EXISTS positions (
        user_id VARCHAR(255) NOT NULL,
        market_id VARCHAR(255) NOT NULL,
        selection_id VARCHAR(255) NOT NULL,
        side VARCHAR(50) NOT NULL,
        exposure NUMERIC(20, 2) NOT NULL DEFAULT 0,
        pnl NUMERIC(20, 2) NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL,
        PRIMARY KEY (user_id, market_id, selection_id)
    );

    CREATE INDEX IF NOT EXISTS idx_positions_user_id ON positions(user_id);
    `

	_, err := db.Exec(schema)
	return err
}

func startHTTPServer(cfg config, svc *portfolio.Service, logger *zap.Logger) *http.Server {
	r := gin.Default()

	r.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})

	r.GET("/metrics", gin.WrapH(promhttp.Handler()))

	handler := httpapi.NewHandler(svc)
	handler.RegisterRoutes(r)

	addr := ":" + cfg.HTTPPort
	server := &http.Server{
		Addr:    addr,
		Handler: r,
	}

	go func() {
		logger.Info("starting HTTP server", zap.String("addr", addr))
		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Fatal("http server error", zap.Error(err))
		}
	}()

	return server
}

func startGRPCServer(cfg config, svc *portfolio.Service, logger *zap.Logger) *grpc.Server {
	addr := ":" + cfg.GRPCPort
	lis, err := net.Listen("tcp", addr)
	if err != nil {
		logger.Fatal("failed to listen", zap.String("addr", addr), zap.Error(err))
	}

	grpcServer := grpc.NewServer(grpc.ForceServerCodec(grpcapi.JSONCodec))
	portfolioServer := grpcapi.NewServer(svc)
	portfolioServer.Register(grpcServer)

	go func() {
		logger.Info("starting gRPC server", zap.String("addr", addr))
		if err := grpcServer.Serve(lis); err != nil {
			logger.Fatal("grpc server error", zap.Error(err))
		}
	}()

	return grpcServer
}
