package hub

import "time"

// BroadcastMessage represents a message destined for subscribers of a channel.
type BroadcastMessage struct {
	Channel   string
	Payload   []byte
	Timestamp time.Time
}

// ClientMessage represents a control message sent from clients to the hub.
type ClientMessage struct {
	Type     string   `json:"type"`
	Channels []string `json:"channels,omitempty"`
}
