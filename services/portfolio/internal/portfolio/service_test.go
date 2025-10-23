package portfolio_test

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/portfolio-service/internal/portfolio"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type MockRepository struct {
	mock.Mock
}

func (m *MockRepository) CreateOrder(order *portfolio.Order) error {
	args := m.Called(order)
	return args.Error(0)
}

func (m *MockRepository) GetOrderByID(orderID string) (*portfolio.Order, error) {
	args := m.Called(orderID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*portfolio.Order), args.Error(1)
}

func (m *MockRepository) GetOpenOrdersByUser(userID string) ([]portfolio.Order, error) {
	args := m.Called(userID)
	return args.Get(0).([]portfolio.Order), args.Error(1)
}

func (m *MockRepository) UpdateOrderStatus(orderID string, status portfolio.OrderStatus, payout float64, settledAt *time.Time) error {
	args := m.Called(orderID, status, payout, settledAt)
	return args.Error(0)
}

func (m *MockRepository) CreateOrUpdatePosition(position *portfolio.Position) error {
	args := m.Called(position)
	return args.Error(0)
}

func (m *MockRepository) GetPosition(userID, marketID, selectionID string) (*portfolio.Position, error) {
	args := m.Called(userID, marketID, selectionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*portfolio.Position), args.Error(1)
}

func (m *MockRepository) GetPositionsByUser(userID string) ([]portfolio.Position, error) {
	args := m.Called(userID)
	return args.Get(0).([]portfolio.Position), args.Error(1)
}

func (m *MockRepository) GetPerformanceMetrics(userID string) (*portfolio.PerformanceMetrics, error) {
	args := m.Called(userID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*portfolio.PerformanceMetrics), args.Error(1)
}

type MockPublisher struct {
	mock.Mock
}

func (m *MockPublisher) Publish(ctx context.Context, event portfolio.Event) error {
	args := m.Called(ctx, event)
	return args.Error(0)
}

type MockAnalytics struct {
	mock.Mock
}

func (m *MockAnalytics) GetInsight(ctx context.Context, marketID, selectionID string) (*portfolio.AnalyticsInsight, error) {
	args := m.Called(ctx, marketID, selectionID)
	if args.Get(0) == nil {
		return nil, args.Error(1)
	}
	return args.Get(0).(*portfolio.AnalyticsInsight), args.Error(1)
}

type MockClock struct {
	fixedTime time.Time
}

func (m MockClock) Now() time.Time {
	return m.fixedTime
}

func TestPlaceOrder_Success(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	fixedTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := MockClock{fixedTime: fixedTime}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	input := portfolio.PlaceOrderInput{
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideBack,
		Stake:       100.0,
		Odds:        2.5,
	}

	repo.On("CreateOrder", mock.AnythingOfType("*portfolio.Order")).Return(nil)
	repo.On("GetPosition", "user123", "market456", "selection789").Return(nil, nil)
	repo.On("CreateOrUpdatePosition", mock.AnythingOfType("*portfolio.Position")).Return(nil)
	publisher.On("Publish", mock.Anything, mock.Anything).Return(nil)
	analytics.On("GetInsight", mock.Anything, "market456", "selection789").Return(&portfolio.AnalyticsInsight{
		MarketID:           "market456",
		SelectionID:        "selection789",
		ImpliedProbability: 0.4,
		ExpectedValue:      1.1,
		Momentum:           0.05,
		LastUpdated:        fixedTime,
	}, nil)

	output, err := svc.PlaceOrder(context.Background(), input)

	assert.NoError(t, err)
	assert.NotNil(t, output)
	assert.Equal(t, "user123", output.Order.UserID)
	assert.Equal(t, "market456", output.Order.MarketID)
	assert.Equal(t, portfolio.OrderStatusOpen, output.Order.Status)
	assert.Equal(t, 100.0, output.Order.Stake)
	assert.Equal(t, 2.5, output.Order.Odds)
	assert.Equal(t, 100.0, output.Position.Exposure)
	assert.NotNil(t, output.Insight)
	assert.Equal(t, 0.4, output.Insight.ImpliedProbability)

	repo.AssertExpectations(t)
	publisher.AssertExpectations(t)
	analytics.AssertExpectations(t)
}

func TestPlaceOrder_InvalidStake(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	input := portfolio.PlaceOrderInput{
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideBack,
		Stake:       0,
		Odds:        2.5,
	}

	output, err := svc.PlaceOrder(context.Background(), input)

	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Equal(t, portfolio.ErrInvalidStake, err)
}

func TestPlaceOrder_InvalidOdds(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	input := portfolio.PlaceOrderInput{
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideBack,
		Stake:       100.0,
		Odds:        0.5,
	}

	output, err := svc.PlaceOrder(context.Background(), input)

	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Equal(t, portfolio.ErrInvalidOdds, err)
}

func TestPlaceOrder_LayBet_CalculatesExposureCorrectly(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	fixedTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := MockClock{fixedTime: fixedTime}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	input := portfolio.PlaceOrderInput{
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideLay,
		Stake:       100.0,
		Odds:        3.0,
	}

	repo.On("CreateOrder", mock.AnythingOfType("*portfolio.Order")).Return(nil)
	repo.On("GetPosition", "user123", "market456", "selection789").Return(nil, nil)
	repo.On("CreateOrUpdatePosition", mock.AnythingOfType("*portfolio.Position")).Return(nil)
	publisher.On("Publish", mock.Anything, mock.Anything).Return(nil)
	analytics.On("GetInsight", mock.Anything, "market456", "selection789").Return(nil, portfolio.ErrAnalyticsUnavailable)

	output, err := svc.PlaceOrder(context.Background(), input)

	assert.NoError(t, err)
	assert.NotNil(t, output)
	assert.Equal(t, 200.0, output.Position.Exposure)

	repo.AssertExpectations(t)
}

func TestSettleOrder_Success(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	fixedTime := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
	clock := MockClock{fixedTime: fixedTime}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	existingOrder := &portfolio.Order{
		ID:          "order123",
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideBack,
		Stake:       100.0,
		Odds:        2.5,
		Status:      portfolio.OrderStatusOpen,
		Payout:      0,
		CreatedAt:   fixedTime,
	}

	input := portfolio.SettleOrderInput{
		OrderID: "order123",
		Won:     true,
		Payout:  250.0,
	}

	repo.On("GetOrderByID", "order123").Return(existingOrder, nil)
	repo.On("UpdateOrderStatus", "order123", portfolio.OrderStatusSettled, 250.0, mock.AnythingOfType("*time.Time")).Return(nil)
	repo.On("GetPosition", "user123", "market456", "selection789").Return(&portfolio.Position{
		UserID:      "user123",
		MarketID:    "market456",
		SelectionID: "selection789",
		Side:        portfolio.OrderSideBack,
		Exposure:    100.0,
		PnL:         0,
		UpdatedAt:   fixedTime,
	}, nil)
	repo.On("CreateOrUpdatePosition", mock.AnythingOfType("*portfolio.Position")).Return(nil)
	repo.On("GetPerformanceMetrics", "user123").Return(&portfolio.PerformanceMetrics{
		TotalStake:   100.0,
		TotalPayout:  250.0,
		ROI:          150.0,
		OrdersPlaced: 1,
		OrdersWon:    1,
	}, nil)
	publisher.On("Publish", mock.Anything, mock.Anything).Return(nil)

	output, err := svc.SettleOrder(context.Background(), input)

	assert.NoError(t, err)
	assert.NotNil(t, output)
	assert.Equal(t, portfolio.OrderStatusSettled, output.Order.Status)
	assert.Equal(t, 250.0, output.Order.Payout)
	assert.Equal(t, 150.0, output.Position.PnL)
	assert.Equal(t, 150.0, output.Metrics.ROI)

	repo.AssertExpectations(t)
	publisher.AssertExpectations(t)
}

func TestSettleOrder_OrderNotFound(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	input := portfolio.SettleOrderInput{
		OrderID: "nonexistent",
		Won:     true,
		Payout:  250.0,
	}

	repo.On("GetOrderByID", "nonexistent").Return(nil, errors.New("order not found"))

	output, err := svc.SettleOrder(context.Background(), input)

	assert.Error(t, err)
	assert.Nil(t, output)
	assert.Equal(t, portfolio.ErrOrderNotFound, err)

	repo.AssertExpectations(t)
}

func TestGetOpenOrders(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	expectedOrders := []portfolio.Order{
		{
			ID:          "order1",
			UserID:      "user123",
			MarketID:    "market456",
			SelectionID: "selection789",
			Side:        portfolio.OrderSideBack,
			Stake:       100.0,
			Odds:        2.5,
			Status:      portfolio.OrderStatusOpen,
		},
	}

	repo.On("GetOpenOrdersByUser", "user123").Return(expectedOrders, nil)

	orders, err := svc.GetOpenOrders(context.Background(), "user123")

	assert.NoError(t, err)
	assert.Len(t, orders, 1)
	assert.Equal(t, "order1", orders[0].ID)

	repo.AssertExpectations(t)
}

func TestGetPositions(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	expectedPositions := []portfolio.Position{
		{
			UserID:      "user123",
			MarketID:    "market456",
			SelectionID: "selection789",
			Side:        portfolio.OrderSideBack,
			Exposure:    100.0,
			PnL:         50.0,
		},
	}

	repo.On("GetPositionsByUser", "user123").Return(expectedPositions, nil)

	positions, err := svc.GetPositions(context.Background(), "user123")

	assert.NoError(t, err)
	assert.Len(t, positions, 1)
	assert.Equal(t, "user123", positions[0].UserID)
	assert.Equal(t, 100.0, positions[0].Exposure)
	assert.Equal(t, 50.0, positions[0].PnL)

	repo.AssertExpectations(t)
}

func TestGetPerformanceMetrics(t *testing.T) {
	repo := new(MockRepository)
	publisher := new(MockPublisher)
	analytics := new(MockAnalytics)
	clock := MockClock{fixedTime: time.Now()}

	svc := portfolio.NewService(repo, publisher, analytics, clock)

	expectedMetrics := &portfolio.PerformanceMetrics{
		TotalStake:   500.0,
		TotalPayout:  750.0,
		ROI:          50.0,
		OrdersPlaced: 10,
		OrdersWon:    6,
	}

	repo.On("GetPerformanceMetrics", "user123").Return(expectedMetrics, nil)

	metrics, err := svc.GetPerformanceMetrics(context.Background(), "user123")

	assert.NoError(t, err)
	assert.Equal(t, 500.0, metrics.TotalStake)
	assert.Equal(t, 750.0, metrics.TotalPayout)
	assert.Equal(t, 50.0, metrics.ROI)
	assert.Equal(t, 10, metrics.OrdersPlaced)
	assert.Equal(t, 6, metrics.OrdersWon)

	repo.AssertExpectations(t)
}
