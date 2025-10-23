package metrics

import (
	"net/http"

	"github.com/prometheus/client_golang/prometheus"
	"github.com/prometheus/client_golang/prometheus/promauto"
	"github.com/prometheus/client_golang/prometheus/promhttp"
)

// Metrics exposes Prometheus metrics for the ingest service.
type Metrics struct {
	RequestsTotal prometheus.Counter
	SuccessTotal  prometheus.Counter
	FailuresTotal prometheus.Counter
	KafkaSuccess  prometheus.Counter
	KafkaFailures prometheus.Counter
	DBSuccess     prometheus.Counter
	DBFailures    prometheus.Counter
	LastPollGauge prometheus.Gauge
}

// New constructs Metrics registered against the default Prometheus registry.
func New() *Metrics {
	return NewWith(prometheus.DefaultRegisterer)
}

// NewWith allows supplying a custom registry for tests.
func NewWith(registerer prometheus.Registerer) *Metrics {
	factory := promauto.With(registerer)

	return &Metrics{
		RequestsTotal: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_requests_total",
			Help: "Total number of fetch attempts to The Odds API",
		}),
		SuccessTotal: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_success_total",
			Help: "Total number of successful odds fetch operations",
		}),
		FailuresTotal: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_failures_total",
			Help: "Total number of failed odds fetch operations",
		}),
		KafkaSuccess: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_kafka_success_total",
			Help: "Total number of successful Kafka publications",
		}),
		KafkaFailures: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_kafka_failures_total",
			Help: "Total number of failed Kafka publications",
		}),
		DBSuccess: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_db_success_total",
			Help: "Total number of successful snapshot inserts",
		}),
		DBFailures: factory.NewCounter(prometheus.CounterOpts{
			Name: "odds_ingest_db_failures_total",
			Help: "Total number of failed snapshot inserts",
		}),
		LastPollGauge: factory.NewGauge(prometheus.GaugeOpts{
			Name: "odds_ingest_last_poll_timestamp",
			Help: "Unix timestamp of the last successful odds fetch",
		}),
	}
}

// Handler returns an http.Handler that serves Prometheus metrics from the default gatherer.
func Handler() http.Handler {
	return HandlerWith(prometheus.DefaultGatherer)
}

// HandlerWith exposes an HTTP handler for a custom prometheus gatherer.
func HandlerWith(gatherer prometheus.Gatherer) http.Handler {
	return promhttp.HandlerFor(gatherer, promhttp.HandlerOpts{})
}
