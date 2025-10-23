package http

import (
    "context"
    "errors"
    "log"
    "net/http"
    "strings"
    "sync"
    "time"

    "github.com/gorilla/websocket"

    "github.com/enterprise/ws-realtime/internal/auth"
    "github.com/enterprise/ws-realtime/internal/hub"
)

// Server exposes WebSocket endpoints for real-time distribution.
type Server struct {
    addr          string
    hub           *hub.Hub
    authenticator *auth.Authenticator
    logger        *log.Logger
    clientBuffer  int
    allowedOrigin map[string]struct{}
    upgrader      websocket.Upgrader
    server        *http.Server
    baseCtx       context.Context
    mu            sync.RWMutex
}

// New constructs a WebSocket server.
func New(addr string, hub *hub.Hub, authenticator *auth.Authenticator, allowedOrigins []string, clientBuffer int, logger *log.Logger) *Server {
    allowed := make(map[string]struct{}, len(allowedOrigins))
    for _, origin := range allowedOrigins {
        origin = strings.TrimSpace(origin)
        if origin != "" {
            allowed[origin] = struct{}{}
        }
    }

    srv := &Server{
        addr:          addr,
        hub:           hub,
        authenticator: authenticator,
        logger:        logger,
        clientBuffer:  clientBuffer,
        allowedOrigin: allowed,
    }

    srv.upgrader = websocket.Upgrader{
        ReadBufferSize:  1024,
        WriteBufferSize: 1024,
        CheckOrigin:     srv.checkOrigin,
    }

    return srv
}

// Start launches the HTTP server and blocks until it exits.
func (s *Server) Start(ctx context.Context) error {
    s.mu.Lock()
    s.baseCtx = ctx
    s.mu.Unlock()

    mux := http.NewServeMux()
    mux.HandleFunc("/healthz", s.handleHealth)
    mux.HandleFunc("/ws", s.handleWebsocket)

    srv := &http.Server{
        Addr:              s.addr,
        Handler:           mux,
        ReadHeaderTimeout: 5 * time.Second,
    }

    s.mu.Lock()
    s.server = srv
    s.mu.Unlock()

    go func() {
        <-ctx.Done()
        shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
        defer cancel()
        if err := srv.Shutdown(shutdownCtx); err != nil && !errors.Is(err, context.Canceled) {
            s.logger.Printf("http shutdown error: %v", err)
        }
    }()

    err := srv.ListenAndServe()
    if err != nil && !errors.Is(err, http.ErrServerClosed) {
        return err
    }

    return nil
}

func (s *Server) handleHealth(w http.ResponseWriter, _ *http.Request) {
    w.Header().Set("Content-Type", "application/json")
    _, _ = w.Write([]byte(`{"status":"ok"}`))
}

func (s *Server) handleWebsocket(w http.ResponseWriter, r *http.Request) {
    token, err := s.extractToken(r)
    if err != nil {
        s.respondUnauthorized(w)
        return
    }

    userID, err := s.authenticator.Validate(token)
    if err != nil {
        s.respondUnauthorized(w)
        return
    }

    conn, err := s.upgrader.Upgrade(w, r, nil)
    if err != nil {
        s.logger.Printf("failed to upgrade websocket: %v", err)
        return
    }

    s.mu.RLock()
    baseCtx := s.baseCtx
    s.mu.RUnlock()
    if baseCtx == nil {
        baseCtx = context.Background()
    }

    clientCtx, cancel := context.WithCancel(baseCtx)
    defer cancel()

    client := hub.NewClient(s.hub, userID, conn, s.clientBuffer, s.logger)
    s.logger.Printf("client connected: id=%s user=%s", client.ID(), client.User())
    client.Run(clientCtx)
    s.logger.Printf("client disconnected: id=%s user=%s", client.ID(), client.User())
}

func (s *Server) extractToken(r *http.Request) (string, error) {
    authHeader := r.Header.Get("Authorization")
    if authHeader != "" {
        fields := strings.Fields(authHeader)
        if len(fields) == 2 && strings.EqualFold(fields[0], "Bearer") {
            return fields[1], nil
        }
    }

    token := r.URL.Query().Get("token")
    if token != "" {
        return token, nil
    }

    return "", auth.ErrUnauthorized
}

func (s *Server) respondUnauthorized(w http.ResponseWriter) {
    http.Error(w, "unauthorized", http.StatusUnauthorized)
}

func (s *Server) checkOrigin(r *http.Request) bool {
    if len(s.allowedOrigin) == 0 {
        return true
    }

    origin := strings.TrimSpace(r.Header.Get("Origin"))
    if origin == "" {
        return false
    }

    _, allowed := s.allowedOrigin[origin]
    return allowed
}
