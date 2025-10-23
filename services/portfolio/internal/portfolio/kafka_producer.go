package portfolio

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/segmentio/kafka-go"
)

// EventType identifies the type of domain event.
type EventType string

const (
	// EventTypeOrderPlaced is emitted when an order is placed.
	EventTypeOrderPlaced EventType = "order.placed"
	// EventTypeOrderSettled is emitted when an order is settled.
	EventTypeOrderSettled EventType = "order.settled"
	// EventTypePositionUpdated is emitted when a position is updated.
	EventTypePositionUpdated EventType = "position.updated"
)

// Event represents a generic event envelope.
type Event struct {
	Type      EventType   `json:"type"`
	Timestamp int64       `json:"timestamp"`
	Payload   interface{} `json:"payload"`
}

// EventPublisher defines the interface for publishing domain events.
type EventPublisher interface {
	Publish(ctx context.Context, event Event) error
}

// KafkaProducer is an EventPublisher backed by Kafka.
type KafkaProducer struct {
	writer *kafka.Writer
}

// NewKafkaProducer creates a new KafkaProducer.
func NewKafkaProducer(brokers []string, topic string) *KafkaProducer {
	return &KafkaProducer{
		writer: &kafka.Writer{
			Addr:     kafka.TCP(brokers...),
			Topic:    topic,
			Balancer: &kafka.LeastBytes{},
		},
	}
}

// Publish serializes and publishes an event to Kafka.
func (kp *KafkaProducer) Publish(ctx context.Context, event Event) error {
	payload, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	msg := kafka.Message{
		Key:   []byte(string(event.Type)),
		Value: payload,
	}

	return kp.writer.WriteMessages(ctx, msg)
}

// Close closes the underlying Kafka writer.
func (kp *KafkaProducer) Close() error {
	return kp.writer.Close()
}
