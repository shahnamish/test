package throttle

import (
	"context"
	"time"
)

// RateLimiter enforces a rate limit using a token bucket algorithm.
type RateLimiter struct {
	ticker *time.Ticker
	tokens chan struct{}
}

// NewRateLimiter creates a RateLimiter that allows requestsPerMinute requests.
func NewRateLimiter(requestsPerMinute int) *RateLimiter {
	rl := &RateLimiter{
		ticker: time.NewTicker(time.Minute / time.Duration(requestsPerMinute)),
		tokens: make(chan struct{}, requestsPerMinute),
	}

	for i := 0; i < requestsPerMinute; i++ {
		rl.tokens <- struct{}{}
	}

	go rl.refill()
	return rl
}

func (rl *RateLimiter) refill() {
	for range rl.ticker.C {
		select {
		case rl.tokens <- struct{}{}:
		default:
		}
	}
}

// Wait blocks until a request can be made or ctx is cancelled.
func (rl *RateLimiter) Wait(ctx context.Context) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	case <-rl.tokens:
		return nil
	}
}

// Stop releases resources used by the rate limiter.
func (rl *RateLimiter) Stop() {
	rl.ticker.Stop()
	close(rl.tokens)
}
