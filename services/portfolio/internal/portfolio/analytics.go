package portfolio

import (
	"context"
	"encoding/json"
	"errors"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
)

// AnalyticsClient exposes analytics insights for markets and selections.
type AnalyticsClient interface {
	GetInsight(ctx context.Context, marketID, selectionID string) (*AnalyticsInsight, error)
}

// ErrAnalyticsUnavailable indicates analytics data could not be retrieved.
var ErrAnalyticsUnavailable = errors.New("analytics data unavailable")

// KafkaAnalyticsClient consumes analytics insights from Kafka and caches them in memory.
type KafkaAnalyticsClient struct {
	reader *kafka.Reader
	cache  map[string]*AnalyticsInsight
	mu     sync.RWMutex
}

// NewKafkaAnalyticsClient constructs a KafkaAnalyticsClient.
func NewKafkaAnalyticsClient(brokers []string, topic, groupID string) *KafkaAnalyticsClient {
	return &KafkaAnalyticsClient{
		reader: kafka.NewReader(kafka.ReaderConfig{
			Brokers: brokers,
			Topic:   topic,
			GroupID: groupID,
		}),
		cache: make(map[string]*AnalyticsInsight),
	}
}

// Start begins consuming analytics data until the context is cancelled.
func (c *KafkaAnalyticsClient) Start(ctx context.Context) {
	go func() {
		for {
			msg, err := c.reader.FetchMessage(ctx)
			if err != nil {
				return
			}

			var insight AnalyticsInsight
			if err := json.Unmarshal(msg.Value, &insight); err == nil {
				c.mu.Lock()
				key := cacheKey(insight.MarketID, insight.SelectionID)
				insight.LastUpdated = time.Now().UTC()
				c.cache[key] = &insight
				c.mu.Unlock()
			}

			_ = c.reader.CommitMessages(ctx, msg)
		}
	}()
}

// GetInsight returns the most recent analytics insight for a market selection.
func (c *KafkaAnalyticsClient) GetInsight(ctx context.Context, marketID, selectionID string) (*AnalyticsInsight, error) {
	c.mu.RLock()
	defer c.mu.RUnlock()

	key := cacheKey(marketID, selectionID)
	insight, ok := c.cache[key]
	if !ok {
		return nil, ErrAnalyticsUnavailable
	}

	// Return a copy to avoid data races with callers.
	clone := *insight
	return &clone, nil
}

// Close stops the reader and releases resources.
func (c *KafkaAnalyticsClient) Close() error {
	return c.reader.Close()
}

func cacheKey(marketID, selectionID string) string {
	return marketID + ":" + selectionID
}
