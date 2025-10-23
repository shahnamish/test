package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/example/authservice/internal/auth"
	"github.com/example/authservice/internal/config"
	"github.com/example/authservice/internal/database"
	"github.com/example/authservice/internal/http/handlers"
	"github.com/example/authservice/internal/http/middleware"
	"github.com/example/authservice/internal/repository"
	"github.com/example/authservice/internal/service"
)

func main() {
	if err := run(); err != nil {
		log.Fatal(err)
	}
}

func run() error {
	cfg, err := config.Load()
	if err != nil {
		return fmt.Errorf("load config: %w", err)
	}

	ctx := context.Background()

	db, err := database.Connect(ctx, cfg.Database.ConnectionString())
	if err != nil {
		return fmt.Errorf("connect to database: %w", err)
	}
	defer db.Close()

	if err := database.Migrate(ctx, db); err != nil {
		return fmt.Errorf("run migrations: %w", err)
	}

	userRepo := repository.NewUserRepository(db)
	sessionRepo := repository.NewSessionRepository(db)

	jwtManager := auth.NewJWTManager(
		cfg.JWT.Secret,
		cfg.JWT.AccessTokenTTL,
		cfg.JWT.RefreshTokenTTL,
		cfg.JWT.Issuer,
	)

	mfaService := auth.NewMFAService(cfg.MFA.Issuer)

	authService := service.NewAuthService(db, userRepo, sessionRepo, jwtManager, mfaService)

	authHandler := handlers.NewAuthHandler(authService)
	authMiddleware := middleware.NewAuthMiddleware(jwtManager)

	mux := http.NewServeMux()

	mux.HandleFunc("/health", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("OK"))
	})

	mux.HandleFunc("/api/auth/register", authHandler.Register)
	mux.HandleFunc("/api/auth/login", authHandler.Login)
	mux.HandleFunc("/api/auth/refresh", authHandler.RefreshToken)
	mux.HandleFunc("/api/auth/logout", authHandler.Logout)

	mux.Handle("/api/auth/me", authMiddleware.Authenticate(http.HandlerFunc(authHandler.Me)))
	mux.Handle("/api/auth/mfa/enable", authMiddleware.Authenticate(http.HandlerFunc(authHandler.EnableMFA)))
	mux.Handle("/api/auth/mfa/verify", authMiddleware.Authenticate(http.HandlerFunc(authHandler.VerifyMFA)))
	mux.Handle("/api/auth/mfa/disable", authMiddleware.Authenticate(http.HandlerFunc(authHandler.DisableMFA)))

	handler := middleware.CORS(mux)

	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%s", cfg.Server.Host, cfg.Server.Port),
		Handler:      handler,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	serverErrors := make(chan error, 1)
	go func() {
		log.Printf("Starting server on %s", server.Addr)
		serverErrors <- server.ListenAndServe()
	}()

	shutdown := make(chan os.Signal, 1)
	signal.Notify(shutdown, syscall.SIGINT, syscall.SIGTERM)

	select {
	case err := <-serverErrors:
		return fmt.Errorf("server error: %w", err)
	case sig := <-shutdown:
		log.Printf("Shutdown signal received: %v", sig)

		ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
		defer cancel()

		if err := server.Shutdown(ctx); err != nil {
			server.Close()
			return fmt.Errorf("graceful shutdown failed: %w", err)
		}
	}

	return nil
}
