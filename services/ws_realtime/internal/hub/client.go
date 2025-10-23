package hub

import (
    "context"
    "encoding/json"
    "fmt"
    "log"
    "strings"
    "sync"
    "time"

    "github.com/gorilla/websocket"
)

const (
    writeWait      = 10 * time.Second
    pongWait       = 60 * time.Second
    pingPeriod     = 54 * time.Second
    maxMessageSize = 8 * 1024
)

// Client represents a WebSocket client connection.
type Client struct {
    hub    *Hub
    conn   *websocket.Conn
    send   chan []byte
    userID string
    id     string
    logger *log.Logger

    closeOnce    sync.Once
    closeReason  string
    closeReasonM sync.Mutex
}

// NewClient constructs a client with the provided hub and WebSocket connection.
func NewClient(h *Hub, userID string, conn *websocket.Conn, bufferSize int, logger *log.Logger) *Client {
    client := &Client{
        hub:    h,
        conn:   conn,
        send:   make(chan []byte, bufferSize),
        userID: userID,
        id:     fmt.Sprintf("%s-%d", userID, time.Now().UnixNano()),
        logger: logger,
    }
    return client
}

// ID returns the client identifier.
func (c *Client) ID() string {
    return c.id
}

// User returns the authenticated user identifier.
func (c *Client) User() string {
    return c.userID
}

// Queue enqueues a message for asynchronous delivery.
func (c *Client) Queue(message []byte) bool {
    select {
    case c.send <- message:
        return true
    default:
        return false
    }
}

// Run launches reader and writer pumps for the client connection.
func (c *Client) Run(ctx context.Context) {
    c.hub.Register(c)
    go c.writePump(ctx)
    c.readPump(ctx)
}

// Close terminates the connection.
func (c *Client) Close() {
    c.closeWithReason(websocket.CloseNormalClosure, c.closeReason)
}

// CloseWithError terminates the connection with a specified error.
func (c *Client) CloseWithError(err error) {
    reason := ""
    if err != nil {
        reason = err.Error()
    }
    c.closeWithReason(websocket.ClosePolicyViolation, reason)
}

func (c *Client) closeWithReason(code int, reason string) {
    c.setReason(reason)
    c.closeOnce.Do(func() {
        close(c.send)
        err := c.conn.WriteControl(websocket.CloseMessage, websocket.FormatCloseMessage(code, reason), time.Now().Add(writeWait))
        if err != nil {
            c.logger.Printf("failed to send close control frame: %v", err)
        }
        if err := c.conn.Close(); err != nil {
            c.logger.Printf("failed to close websocket connection: %v", err)
        }
    })
}

func (c *Client) setReason(reason string) {
    c.closeReasonM.Lock()
    c.closeReason = reason
    c.closeReasonM.Unlock()
}

func (c *Client) readPump(ctx context.Context) {
    defer func() {
        c.hub.Remove(c)
        c.Close()
    }()

    c.conn.SetReadLimit(maxMessageSize)
    _ = c.conn.SetReadDeadline(time.Now().Add(pongWait))
    c.conn.SetPongHandler(func(string) error {
        return c.conn.SetReadDeadline(time.Now().Add(pongWait))
    })

    for {
        select {
        case <-ctx.Done():
            return
        default:
        }

        _, message, err := c.conn.ReadMessage()
        if err != nil {
            if websocket.IsUnexpectedCloseError(err, websocket.CloseGoingAway, websocket.CloseAbnormalClosure) {
                c.logger.Printf("client %s disconnected unexpectedly: %v", c.id, err)
            }
            return
        }

        var clientMsg ClientMessage
        if err := json.Unmarshal(message, &clientMsg); err != nil {
            c.logger.Printf("invalid client message from %s: %v", c.id, err)
            continue
        }

        switch clientMsg.Type {
        case "subscribe":
            for _, channel := range clientMsg.Channels {
                channel = strings.TrimSpace(channel)
                if channel == "" {
                    continue
                }
                c.hub.Subscribe(c, channel)
            }
        case "unsubscribe":
            for _, channel := range clientMsg.Channels {
                channel = strings.TrimSpace(channel)
                if channel == "" {
                    continue
                }
                c.hub.Unsubscribe(c, channel)
            }
        case "ping":
            // Clients can send ping frames over the data channel; respond with pong.
            if err := c.conn.WriteControl(websocket.PongMessage, nil, time.Now().Add(writeWait)); err != nil {
                c.logger.Printf("failed to write pong: %v", err)
            }
        default:
            c.logger.Printf("unsupported client message type %q from %s", clientMsg.Type, c.id)
        }
    }
}

func (c *Client) writePump(ctx context.Context) {
    ticker := time.NewTicker(pingPeriod)
    defer ticker.Stop()

    for {
        select {
        case <-ctx.Done():
            return
        case message, ok := <-c.send:
            _ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if !ok {
                _ = c.conn.WriteMessage(websocket.CloseMessage, []byte{})
                return
            }

            if err := c.conn.WriteMessage(websocket.TextMessage, message); err != nil {
                c.logger.Printf("failed to write message to %s: %v", c.id, err)
                return
            }
        case <-ticker.C:
            _ = c.conn.SetWriteDeadline(time.Now().Add(writeWait))
            if err := c.conn.WriteMessage(websocket.PingMessage, nil); err != nil {
                return
            }
        }
    }
}
