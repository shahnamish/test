package portfolio

import "time"

// OrderSide represents the betting side for an order.
type OrderSide string

const (
	// OrderSideBack represents a back bet.
	OrderSideBack OrderSide = "BACK"
	// OrderSideLay represents a lay bet.
	OrderSideLay OrderSide = "LAY"
)

// OrderStatus represents the lifecycle status of an order.
type OrderStatus string

const (
	// OrderStatusOpen represents an order that has not been settled yet.
	OrderStatusOpen OrderStatus = "OPEN"
	// OrderStatusSettled represents an order that has been settled.
	OrderStatusSettled OrderStatus = "SETTLED"
)

// Order encapsulates the details of a bet placement.
type Order struct {
	ID          string
	UserID      string
	MarketID    string
	SelectionID string
	Side        OrderSide
	Stake       float64
	Odds        float64
	Status      OrderStatus
	Payout      float64
	CreatedAt   time.Time
	SettledAt   *time.Time
}

// Position represents the aggregated exposure and PnL for a market selection.
type Position struct {
	UserID      string
	MarketID    string
	SelectionID string
	Side        OrderSide
	Exposure    float64
	PnL         float64
	UpdatedAt   time.Time
}

// PerformanceMetrics aggregates financial performance over a time horizon.
type PerformanceMetrics struct {
	TotalStake   float64
	TotalPayout  float64
	ROI          float64
	OrdersPlaced int
	OrdersWon    int
}

// AnalyticsInsight describes optional analytics data that can augment a bet.
type AnalyticsInsight struct {
	MarketID           string
	SelectionID        string
	ImpliedProbability float64
	ExpectedValue      float64
	Momentum           float64
	LastUpdated        time.Time
}

// SettlementResult represents the outcome of an order settlement.
type SettlementResult struct {
	Won       bool
	Payout    float64
	SettledAt time.Time
}

// PlaceOrderInput is a DTO used to place an order.
type PlaceOrderInput struct {
	UserID      string
	MarketID    string
	SelectionID string
	Side        OrderSide
	Stake       float64
	Odds        float64
}

// PlaceOrderOutput captures the result of placing an order.
type PlaceOrderOutput struct {
	Order    Order
	Position Position
	Insight  *AnalyticsInsight
}

// SettleOrderInput is a DTO used to settle an existing order.
type SettleOrderInput struct {
	OrderID string
	Won     bool
	Payout  float64
}

// SettleOrderOutput captures the result of settling an order.
type SettleOrderOutput struct {
	Order    Order
	Position Position
	Metrics  PerformanceMetrics
}

// Clock abstracts the time source for easier testing.
type Clock interface {
	Now() time.Time
}
