package producer

import (
	"encoding/json"
	"fmt"
	"log"

	"github.com/IBM/sarama"
	"github.com/betting/odds-ingest/internal/config"
	"github.com/betting/odds-ingest/internal/normalizer"
)

// KafkaProducer wraps a Sarama sync producer for sending odds events.
type KafkaProducer struct {
	producer sarama.SyncProducer
	topic    string
}

// NewKafkaProducer creates a new KafkaProducer from config.
func NewKafkaProducer(cfg config.KafkaConfig) (*KafkaProducer, error) {
	saramaCfg := sarama.NewConfig()
	saramaCfg.Producer.Return.Successes = true
	saramaCfg.Producer.RequiredAcks = sarama.WaitForAll
	saramaCfg.Producer.Retry.Max = 3
	saramaCfg.Producer.Compression = sarama.CompressionSnappy
	saramaCfg.ClientID = cfg.ClientID
	saramaCfg.Net.DialTimeout = cfg.Timeout
	saramaCfg.Net.ReadTimeout = cfg.Timeout
	saramaCfg.Net.WriteTimeout = cfg.Timeout

	producer, err := sarama.NewSyncProducer(cfg.Brokers, saramaCfg)
	if err != nil {
		return nil, fmt.Errorf("failed to create Kafka producer: %w", err)
	}

	log.Printf("Kafka producer connected to %v, topic=%s", cfg.Brokers, cfg.Topic)
	return &KafkaProducer{
		producer: producer,
		topic:    cfg.Topic,
	}, nil
}

// Publish sends a NormalizedEvent to the configured Kafka topic.
func (k *KafkaProducer) Publish(event normalizer.NormalizedEvent) error {
	data, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("failed to marshal event: %w", err)
	}

	msg := &sarama.ProducerMessage{
		Topic: k.topic,
		Key:   sarama.StringEncoder(event.EventID),
		Value: sarama.ByteEncoder(data),
	}

	_, _, err = k.producer.SendMessage(msg)
	if err != nil {
		return fmt.Errorf("failed to send message to Kafka: %w", err)
	}
	return nil
}

// Close releases Kafka producer resources.
func (k *KafkaProducer) Close() error {
	return k.producer.Close()
}
