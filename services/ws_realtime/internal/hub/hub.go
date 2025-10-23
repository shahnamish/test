package hub

import (
    "context"
    "encoding/json"
    "errors"
    "log"
    "sync"
)

type subscriptionRequest struct {
    client  *Client
    channel string
}

// Hub manages WebSocket clients and fan-out of Kafka messages to subscribers.
type Hub struct {
    register    chan *Client
    unregister  chan *Client
    subscribe   chan subscriptionRequest
    unsubscribe chan subscriptionRequest
    broadcast   chan BroadcastMessage

    clients             map[*Client]struct{}
    channelSubscribers  map[string]map[*Client]struct{}
    clientSubscriptions map[*Client]map[string]struct{}
    allowedChannels     map[string]struct{}

    logger *log.Logger
    mu     sync.RWMutex
}

// New creates a hub instance.
func New(allowed []string, logger *log.Logger) *Hub {
    allowedMap := make(map[string]struct{}, len(allowed))
    for _, channel := range allowed {
        if channel == "" {
            continue
        }
        allowedMap[channel] = struct{}{}
    }

    return &Hub{
        register:            make(chan *Client),
        unregister:          make(chan *Client),
        subscribe:           make(chan subscriptionRequest),
        unsubscribe:         make(chan subscriptionRequest),
        broadcast:           make(chan BroadcastMessage, 256),
        clients:             make(map[*Client]struct{}),
        channelSubscribers:  make(map[string]map[*Client]struct{}),
        clientSubscriptions: make(map[*Client]map[string]struct{}),
        allowedChannels:     allowedMap,
        logger:              logger,
    }
}

// Run starts the hub event loop. It should be executed in its own goroutine.
func (h *Hub) Run(ctx context.Context) {
    for {
        select {
        case client := <-h.register:
            h.addClient(client)
        case client := <-h.unregister:
            h.removeClient(client)
        case req := <-h.subscribe:
            h.addSubscription(req)
        case req := <-h.unsubscribe:
            h.removeSubscription(req)
        case message := <-h.broadcast:
            h.dispatch(message)
        case <-ctx.Done():
            h.shutdown()
            return
        }
    }
}

// Register signals that a new client should be added to the hub.
func (h *Hub) Register(client *Client) {
    h.register <- client
}

// Unregister requests that a client be removed from the hub.
func (h *Hub) Unregister(client *Client) {
    h.unregister <- client
}

// Remove performs an immediate client removal bypassing the event loop. This is
// primarily used during shutdown sequences where the event loop is no longer
// servicing commands.
func (h *Hub) Remove(client *Client) {
    h.removeClient(client)
}

// Subscribe requests that a client subscribes to a channel.
func (h *Hub) Subscribe(client *Client, channel string) {
    h.subscribe <- subscriptionRequest{client: client, channel: channel}
}

// Unsubscribe requests that a client unsubscribes from a channel.
func (h *Hub) Unsubscribe(client *Client, channel string) {
    h.unsubscribe <- subscriptionRequest{client: client, channel: channel}
}

// Publish enqueues a message to subscribers of the specified channel.
func (h *Hub) Publish(msg BroadcastMessage) {
    h.broadcast <- msg
}

func (h *Hub) addClient(client *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()

    h.clients[client] = struct{}{}
    h.clientSubscriptions[client] = make(map[string]struct{})
}

func (h *Hub) removeClient(client *Client) {
    h.mu.Lock()
    defer h.mu.Unlock()

    if _, ok := h.clients[client]; !ok {
        return
    }
    for channel := range h.clientSubscriptions[client] {
        if subscribers, exists := h.channelSubscribers[channel]; exists {
            delete(subscribers, client)
            if len(subscribers) == 0 {
                delete(h.channelSubscribers, channel)
            }
        }
    }
    delete(h.clientSubscriptions, client)
    delete(h.clients, client)
}

func (h *Hub) addSubscription(req subscriptionRequest) {
    h.mu.Lock()
    defer h.mu.Unlock()

    if _, ok := h.clients[req.client]; !ok {
        return
    }

    if len(h.allowedChannels) > 0 {
        if _, allowed := h.allowedChannels[req.channel]; !allowed {
            h.logger.Printf("rejecting subscription to unauthorized channel %s from client %s", req.channel, req.client.ID())
            return
        }
    }

    subscribers, exists := h.channelSubscribers[req.channel]
    if !exists {
        subscribers = make(map[*Client]struct{})
        h.channelSubscribers[req.channel] = subscribers
    }
    subscribers[req.client] = struct{}{}

    if _, exists := h.clientSubscriptions[req.client]; !exists {
        h.clientSubscriptions[req.client] = make(map[string]struct{})
    }
    h.clientSubscriptions[req.client][req.channel] = struct{}{}
}

func (h *Hub) removeSubscription(req subscriptionRequest) {
    h.mu.Lock()
    defer h.mu.Unlock()

    if _, ok := h.clients[req.client]; !ok {
        return
    }

    if subscribers, exists := h.channelSubscribers[req.channel]; exists {
        delete(subscribers, req.client)
        if len(subscribers) == 0 {
            delete(h.channelSubscribers, req.channel)
        }
    }

    if clientSubs, exists := h.clientSubscriptions[req.client]; exists {
        delete(clientSubs, req.channel)
    }
}

func (h *Hub) dispatch(msg BroadcastMessage) {
    if len(h.allowedChannels) > 0 {
        if _, allowed := h.allowedChannels[msg.Channel]; !allowed {
            h.logger.Printf("dropping message for unauthorized channel %s", msg.Channel)
            return
        }
    }

    payload, err := encodeOutbound(msg)
    if err != nil {
        h.logger.Printf("failed to encode outbound message: %v", err)
        return
    }

    h.mu.RLock()
    subscribers := h.channelSubscribers[msg.Channel]
    for client := range subscribers {
        if !client.Queue(payload) {
            h.logger.Printf("dropping client %s due to backpressure", client.ID())
            go client.CloseWithError(ErrBackpressure)
        }
    }
    h.mu.RUnlock()
}

func (h *Hub) shutdown() {
    h.mu.Lock()
    defer h.mu.Unlock()

    for client := range h.clients {
        go client.Close()
    }

    h.clients = make(map[*Client]struct{})
    h.channelSubscribers = make(map[string]map[*Client]struct{})
    h.clientSubscriptions = make(map[*Client]map[string]struct{})
}

// ErrBackpressure indicates that the client could not keep up with the outbound message rate.
var ErrBackpressure = errors.New("backpressure")

func encodeOutbound(msg BroadcastMessage) ([]byte, error) {
    var payloadValue any
    if len(msg.Payload) == 0 {
        payloadValue = nil
    } else if json.Valid(msg.Payload) {
        payloadValue = json.RawMessage(msg.Payload)
    } else {
        payloadValue = string(msg.Payload)
    }

    payload := struct {
        Channel    string `json:"channel"`
        Payload    any    `json:"payload"`
        ReceivedAt int64  `json:"received_at"`
    }{
        Channel:    msg.Channel,
        Payload:    payloadValue,
        ReceivedAt: msg.Timestamp.UnixNano(),
    }

    return json.Marshal(payload)
}
