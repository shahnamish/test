package portfolio

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
)

// Service encapsulates the business logic for portfolio and order management.
type Service struct {
	repo      Repository
	publisher EventPublisher
	analytics AnalyticsClient
	clock     Clock
}

// NewService constructs a Service with its dependencies.
func NewService(repo Repository, publisher EventPublisher, analytics AnalyticsClient, clock Clock) *Service {
	return &Service{
		repo:      repo,
		publisher: publisher,
		analytics: analytics,
		clock:     clock,
	}
}

// PlaceOrder validates input, persists the order, updates the position, fetches analytics insights, and emits events.
func (s *Service) PlaceOrder(ctx context.Context, input PlaceOrderInput) (*PlaceOrderOutput, error) {
	if err := s.validateOrderInput(input); err != nil {
		return nil, err
	}

	now := s.clock.Now()
	order := Order{
		ID:          uuid.New().String(),
		UserID:      input.UserID,
		MarketID:    input.MarketID,
		SelectionID: input.SelectionID,
		Side:        input.Side,
		Stake:       input.Stake,
		Odds:        input.Odds,
		Status:      OrderStatusOpen,
		Payout:      0,
		CreatedAt:   now,
		SettledAt:   nil,
	}

	if err := s.repo.CreateOrder(&order); err != nil {
		return nil, fmt.Errorf("failed to create order: %w", err)
	}

	position, err := s.computeAndUpdatePosition(ctx, order, now)
	if err != nil {
		return nil, fmt.Errorf("failed to update position: %w", err)
	}

	insight, _ := s.analytics.GetInsight(ctx, input.MarketID, input.SelectionID)

	if err := s.publishEvent(ctx, EventTypeOrderPlaced, order); err != nil {
		return nil, fmt.Errorf("failed to publish order.placed event: %w", err)
	}

	output := &PlaceOrderOutput{
		Order:    order,
		Position: *position,
		Insight:  insight,
	}

	return output, nil
}

// SettleOrder marks an order as settled, updates the position and metrics, and emits settlement events.
func (s *Service) SettleOrder(ctx context.Context, input SettleOrderInput) (*SettleOrderOutput, error) {
	order, err := s.repo.GetOrderByID(input.OrderID)
	if err != nil {
		return nil, ErrOrderNotFound
	}

	if order.Status == OrderStatusSettled {
		return nil, fmt.Errorf("order already settled")
	}

	now := s.clock.Now()
	payout := input.Payout
	if !input.Won {
		payout = 0
	}

	if err := s.repo.UpdateOrderStatus(order.ID, OrderStatusSettled, payout, &now); err != nil {
		return nil, fmt.Errorf("failed to update order: %w", err)
	}

	order.Status = OrderStatusSettled
	order.Payout = payout
	order.SettledAt = &now

	position, err := s.computeAndUpdatePosition(ctx, *order, now)
	if err != nil {
		return nil, fmt.Errorf("failed to update position: %w", err)
	}

	metrics, err := s.repo.GetPerformanceMetrics(order.UserID)
	if err != nil {
		return nil, fmt.Errorf("failed to fetch metrics: %w", err)
	}

	if err := s.publishEvent(ctx, EventTypeOrderSettled, order); err != nil {
		return nil, fmt.Errorf("failed to publish order.settled event: %w", err)
	}

	output := &SettleOrderOutput{
		Order:    *order,
		Position: *position,
		Metrics:  *metrics,
	}

	return output, nil
}

// GetOpenOrders returns all open orders for a user.
func (s *Service) GetOpenOrders(ctx context.Context, userID string) ([]Order, error) {
	return s.repo.GetOpenOrdersByUser(userID)
}

// GetPositions returns all positions held by a user.
func (s *Service) GetPositions(ctx context.Context, userID string) ([]Position, error) {
	return s.repo.GetPositionsByUser(userID)
}

// GetPerformanceMetrics returns aggregated performance metrics for a user.
func (s *Service) GetPerformanceMetrics(ctx context.Context, userID string) (*PerformanceMetrics, error) {
	return s.repo.GetPerformanceMetrics(userID)
}

func (s *Service) validateOrderInput(input PlaceOrderInput) error {
	if input.Stake <= 0 {
		return ErrInvalidStake
	}
	if input.Odds <= 1.0 {
		return ErrInvalidOdds
	}
	if input.Side != OrderSideBack && input.Side != OrderSideLay {
		return ErrUnknownOrderSide
	}
	return nil
}

func (s *Service) computeAndUpdatePosition(ctx context.Context, order Order, updatedAt time.Time) (*Position, error) {
	position, err := s.repo.GetPosition(order.UserID, order.MarketID, order.SelectionID)
	if err != nil {
		return nil, err
	}

	if position == nil {
		position = &Position{
			UserID:      order.UserID,
			MarketID:    order.MarketID,
			SelectionID: order.SelectionID,
			Side:        order.Side,
			Exposure:    0,
			PnL:         0,
			UpdatedAt:   updatedAt,
		}
	}

	exposureForOrder := order.Stake
	if order.Side == OrderSideLay {
		exposureForOrder = order.Stake * (order.Odds - 1)
	}

	if order.Status == OrderStatusOpen {
		position.Exposure += exposureForOrder
	} else if order.Status == OrderStatusSettled {
		position.Exposure -= exposureForOrder
		if position.Exposure < 0 {
			position.Exposure = 0
		}
		netPnL := order.Payout - order.Stake
		position.PnL += netPnL
	}

	position.UpdatedAt = updatedAt

	if err := s.repo.CreateOrUpdatePosition(position); err != nil {
		return nil, err
	}

	if err := s.publishEvent(ctx, EventTypePositionUpdated, position); err != nil {
		return nil, fmt.Errorf("failed to publish position.updated event: %w", err)
	}

	return position, nil
}

func (s *Service) publishEvent(ctx context.Context, eventType EventType, payload interface{}) error {
	event := Event{
		Type:      eventType,
		Timestamp: s.clock.Now().Unix(),
		Payload:   payload,
	}
	return s.publisher.Publish(ctx, event)
}

// RealClock implements Clock using time.Now().
type RealClock struct{}

// Now returns the current time.
func (RealClock) Now() time.Time {
	return time.Now().UTC()
}
