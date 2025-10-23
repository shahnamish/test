package broker

import (
	"context"
	"log"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

// Event represents a Kafka message delivered to the hub.
type Event struct {
	Topic     string
	Value     []byte
	Partition int
	Offset    int64
	Timestamp time.Time
}

// Dispatcher forwards events to downstream consumers.
type Dispatcher func(context.Context, Event)

// Consumer wraps kafka-go readers for fan-out to the WebSocket hub.
type Consumer struct {
	readers    []*kafka.Reader
	dispatcher Dispatcher
	logger     *log.Logger
}

// NewConsumer constructs a consumer for the specified topics.
func NewConsumer(brokers []string, groupID string, topics []string, dispatcher Dispatcher, logger *log.Logger) *Consumer {
	readers := make([]*kafka.Reader, 0, len(topics))
	for _, topic := range topics {
		topicReader := kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			GroupID: groupID,
			Topic:   topic,
		})
		readers = append(readers, topicReader)
	}

	return &Consumer{
		readers:    readers,
		dispatcher: dispatcher,
		logger:     logger,
	}
}

// Start begins consuming messages until the context is cancelled.
func (c *Consumer) Start(ctx context.Context) {
	var wg sync.WaitGroup
	for _, reader := range c.readers {
		r := reader
		wg.Add(1)
		go func() {
			defer wg.Done()
			c.consumeTopic(ctx, r)
		}()
	}

	<-ctx.Done()

	shutdownCtx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	done := make(chan struct{})
	go func() {
		wg.Wait()
		close(done)
	}()

	select {
	case <-done:
	case <-shutdownCtx.Done():
		c.logger.Printf("timed out waiting for Kafka consumers to close: %v", shutdownCtx.Err())
	}
}

func (c *Consumer) consumeTopic(ctx context.Context, reader *kafka.Reader) {
	for {
		m, err := reader.FetchMessage(ctx)
		if err != nil {
			if err == context.Canceled || err == context.DeadlineExceeded {
				return
			}
			c.logger.Printf("error fetching Kafka message: %v", err)
			continue
		}

		event := Event{
			Topic:     m.Topic,
			Value:     append([]byte(nil), m.Value...),
			Partition: m.Partition,
			Offset:    m.Offset,
			Timestamp: m.Time,
		}

		c.dispatcher(ctx, event)

		if err := reader.CommitMessages(ctx, m); err != nil {
			c.logger.Printf("failed to commit message offset: %v", err)
		}
	}
}

// Close releases all reader resources.
func (c *Consumer) Close() {
	for _, reader := range c.readers {
		if err := reader.Close(); err != nil {
			c.logger.Printf("failed to close reader: %v", err)
		}
	}
}
