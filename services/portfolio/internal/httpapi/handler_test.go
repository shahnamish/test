package httpapi_test

import (
	"bytes"
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/portfolio-service/internal/httpapi"
	"github.com/portfolio-service/internal/portfolio"
	"github.com/stretchr/testify/assert"
)

type fakeRepository struct {
	orders    map[string]portfolio.Order
	positions map[string]portfolio.Position
}

func newFakeRepository() *fakeRepository {
	return &fakeRepository{
		orders:    make(map[string]portfolio.Order),
		positions: make(map[string]portfolio.Position),
	}
}

func (f *fakeRepository) CreateOrder(order *portfolio.Order) error {
	f.orders[order.ID] = *order
	return nil
}

func (f *fakeRepository) GetOrderByID(orderID string) (*portfolio.Order, error) {
	order, ok := f.orders[orderID]
	if !ok {
		return nil, portfolio.ErrOrderNotFound
	}
	copy := order
	return &copy, nil
}

func (f *fakeRepository) GetOpenOrdersByUser(userID string) ([]portfolio.Order, error) {
	var orders []portfolio.Order
	for _, order := range f.orders {
		if order.UserID == userID && order.Status == portfolio.OrderStatusOpen {
			orders = append(orders, order)
		}
	}
	return orders, nil
}

func (f *fakeRepository) UpdateOrderStatus(orderID string, status portfolio.OrderStatus, payout float64, settledAt *time.Time) error {
	order, ok := f.orders[orderID]
	if !ok {
		return portfolio.ErrOrderNotFound
	}
	order.Status = status
	order.Payout = payout
	order.SettledAt = settledAt
	f.orders[orderID] = order
	return nil
}

func (f *fakeRepository) CreateOrUpdatePosition(position *portfolio.Position) error {
	key := position.UserID + ":" + position.MarketID + ":" + position.SelectionID
	f.positions[key] = *position
	return nil
}

func (f *fakeRepository) GetPosition(userID, marketID, selectionID string) (*portfolio.Position, error) {
	key := userID + ":" + marketID + ":" + selectionID
	position, ok := f.positions[key]
	if !ok {
		return nil, nil
	}
	copy := position
	return &copy, nil
}

func (f *fakeRepository) GetPositionsByUser(userID string) ([]portfolio.Position, error) {
	var positions []portfolio.Position
	for _, position := range f.positions {
		if position.UserID == userID {
			positions = append(positions, position)
		}
	}
	return positions, nil
}

func (f *fakeRepository) GetPerformanceMetrics(userID string) (*portfolio.PerformanceMetrics, error) {
	var totalStake, totalPayout float64
	var ordersPlaced, ordersWon int
	for _, order := range f.orders {
		if order.UserID != userID {
			continue
		}
		ordersPlaced++
		totalStake += order.Stake
		totalPayout += order.Payout
		if order.Payout > order.Stake {
			ordersWon++
		}
	}
	roi := 0.0
	if totalStake > 0 {
		roi = ((totalPayout - totalStake) / totalStake) * 100
	}
	return &portfolio.PerformanceMetrics{
		TotalStake:   totalStake,
		TotalPayout:  totalPayout,
		ROI:          roi,
		OrdersPlaced: ordersPlaced,
		OrdersWon:    ordersWon,
	}, nil
}

type fakePublisher struct{}

func (fakePublisher) Publish(_ context.Context, _ portfolio.Event) error { return nil }

type fakeAnalytics struct{}

func (fakeAnalytics) GetInsight(_ context.Context, marketID, selectionID string) (*portfolio.AnalyticsInsight, error) {
	return &portfolio.AnalyticsInsight{
		MarketID:           marketID,
		SelectionID:        selectionID,
		ImpliedProbability: 0.42,
		ExpectedValue:      1.05,
		Momentum:           0.01,
		LastUpdated:        time.Now().UTC(),
	}, nil
}

type fixedClock struct{ now time.Time }

func (f fixedClock) Now() time.Time { return f.now }

func setupHandler() (*portfolio.Service, *httpapi.Handler, *fakeRepository) {
	gin.SetMode(gin.TestMode)
	repo := newFakeRepository()
	publisher := fakePublisher{}
	analytics := fakeAnalytics{}
	clock := fixedClock{now: time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)}

	svc := portfolio.NewService(repo, publisher, analytics, clock)
	handler := httpapi.NewHandler(svc)
	return svc, handler, repo
}

func TestPlaceOrderEndpoint(t *testing.T) {
	_, handler, _ := setupHandler()
	r := gin.New()
	handler.RegisterRoutes(r)

	payload := map[string]interface{}{
		"user_id":      "user1",
		"market_id":    "market1",
		"selection_id": "selection1",
		"side":         string(portfolio.OrderSideBack),
		"stake":        100.0,
		"odds":         2.2,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusCreated, rec.Code)

	var response portfolio.PlaceOrderOutput
	err := json.Unmarshal(rec.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "user1", response.Order.UserID)
	assert.Equal(t, 100.0, response.Order.Stake)
	assert.NotNil(t, response.Insight)
}

func TestSettleOrderEndpoint(t *testing.T) {
	svc, handler, repo := setupHandler()
	r := gin.New()
	handler.RegisterRoutes(r)

	output, err := svc.PlaceOrder(context.Background(), portfolio.PlaceOrderInput{
		UserID:      "user1",
		MarketID:    "market1",
		SelectionID: "selection1",
		Side:        portfolio.OrderSideBack,
		Stake:       100,
		Odds:        2.0,
	})
	assert.NoError(t, err)

	orderID := output.Order.ID

	payload := map[string]interface{}{
		"won":    true,
		"payout": 200.0,
	}
	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest(http.MethodPost, "/api/v1/orders/"+orderID+"/settle", bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")

	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response portfolio.SettleOrderOutput
	err = json.Unmarshal(rec.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, portfolio.OrderStatusSettled, response.Order.Status)
	assert.Equal(t, 100.0, response.Position.PnL)
	_ = repo
}

func TestGetMetricsEndpoint(t *testing.T) {
	svc, handler, _ := setupHandler()
	r := gin.New()
	handler.RegisterRoutes(r)

	output, _ := svc.PlaceOrder(context.Background(), portfolio.PlaceOrderInput{
		UserID:      "user1",
		MarketID:    "market1",
		SelectionID: "selection1",
		Side:        portfolio.OrderSideBack,
		Stake:       100,
		Odds:        2.0,
	})

	_, _ = svc.SettleOrder(context.Background(), portfolio.SettleOrderInput{
		OrderID: output.Order.ID,
		Won:     true,
		Payout:  200,
	})

	req, _ := http.NewRequest(http.MethodGet, "/api/v1/metrics/user1", nil)
	rec := httptest.NewRecorder()
	r.ServeHTTP(rec, req)

	assert.Equal(t, http.StatusOK, rec.Code)

	var response portfolio.PerformanceMetrics
	err := json.Unmarshal(rec.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, 100.0, response.TotalStake)
	assert.Equal(t, 200.0, response.TotalPayout)
	assert.Equal(t, 100.0, response.ROI)
}
