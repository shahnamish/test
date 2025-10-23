package grpcapi

import (
	"context"
	"encoding/json"

	"github.com/portfolio-service/internal/portfolio"
	"google.golang.org/grpc"
	"google.golang.org/grpc/encoding"
)

type jsonCodec struct{}

func (jsonCodec) Name() string {
	return "json"
}

func (jsonCodec) Marshal(v interface{}) ([]byte, error) {
	return json.Marshal(v)
}

func (jsonCodec) Unmarshal(data []byte, v interface{}) error {
	return json.Unmarshal(data, v)
}

var JSONCodec = jsonCodec{}

func init() {
	encoding.RegisterCodec(JSONCodec)
}

// PortfolioServiceServer defines the gRPC server interface.
type PortfolioServiceServer interface {
	PlaceOrder(ctx context.Context, req *PlaceOrderRequest) (*PlaceOrderResponse, error)
	SettleOrder(ctx context.Context, req *SettleOrderRequest) (*SettleOrderResponse, error)
	ListOpenPositions(ctx context.Context, req *ListOpenPositionsRequest) (*ListOpenPositionsResponse, error)
	GetPerformanceMetrics(ctx context.Context, req *GetPerformanceMetricsRequest) (*GetPerformanceMetricsResponse, error)
}

// Server wraps portfolio.Service to satisfy PortfolioServiceServer.
type Server struct {
	service *portfolio.Service
}

// NewServer constructs a gRPC server wrapper.
func NewServer(svc *portfolio.Service) *Server {
	return &Server{service: svc}
}

// Register registers the server with a gRPC server.
func (s *Server) Register(grpcServer *grpc.Server) {
	grpcServer.RegisterService(&_PortfolioService_serviceDesc, s)
}

// PlaceOrder handles gRPC place order calls.
func (s *Server) PlaceOrder(ctx context.Context, req *PlaceOrderRequest) (*PlaceOrderResponse, error) {
	input := portfolio.PlaceOrderInput{
		UserID:      req.UserId,
		MarketID:    req.MarketId,
		SelectionID: req.SelectionId,
		Side:        req.Side,
		Stake:       req.Stake,
		Odds:        req.Odds,
	}

	output, err := s.service.PlaceOrder(ctx, input)
	if err != nil {
		return nil, err
	}

	return &PlaceOrderResponse{
		Order:    toOrderMessage(output.Order),
		Position: toPositionMessage(output.Position),
		Insight:  toInsightMessage(output.Insight),
	}, nil
}

// SettleOrder handles gRPC settle order calls.
func (s *Server) SettleOrder(ctx context.Context, req *SettleOrderRequest) (*SettleOrderResponse, error) {
	input := portfolio.SettleOrderInput{
		OrderID: req.OrderId,
		Won:     req.Won,
		Payout:  req.Payout,
	}

	output, err := s.service.SettleOrder(ctx, input)
	if err != nil {
		return nil, err
	}

	return &SettleOrderResponse{
		Order:    toOrderMessage(output.Order),
		Position: toPositionMessage(output.Position),
		Metrics:  toMetricsMessage(output.Metrics),
	}, nil
}

// ListOpenPositions returns open positions for a user.
func (s *Server) ListOpenPositions(ctx context.Context, req *ListOpenPositionsRequest) (*ListOpenPositionsResponse, error) {
	positions, err := s.service.GetPositions(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	resp := &ListOpenPositionsResponse{}
	for _, pos := range positions {
		resp.Positions = append(resp.Positions, toPositionMessage(pos))
	}
	return resp, nil
}

// GetPerformanceMetrics returns aggregate metrics for a user.
func (s *Server) GetPerformanceMetrics(ctx context.Context, req *GetPerformanceMetricsRequest) (*GetPerformanceMetricsResponse, error) {
	metrics, err := s.service.GetPerformanceMetrics(ctx, req.UserId)
	if err != nil {
		return nil, err
	}

	return &GetPerformanceMetricsResponse{Metrics: toMetricsMessage(*metrics)}, nil
}

// Helpers to convert domain models to transport models.
func toOrderMessage(order portfolio.Order) *Order {
	var settledAt *int64
	if order.SettledAt != nil {
		unix := order.SettledAt.Unix()
		settledAt = &unix
	}

	return &Order{
		Id:          order.ID,
		UserId:      order.UserID,
		MarketId:    order.MarketID,
		SelectionId: order.SelectionID,
		Side:        order.Side,
		Stake:       order.Stake,
		Odds:        order.Odds,
		Status:      string(order.Status),
		Payout:      order.Payout,
		CreatedAt:   order.CreatedAt.Unix(),
		SettledAt:   settledAt,
	}
}

func toPositionMessage(position portfolio.Position) *Position {
	return &Position{
		UserId:      position.UserID,
		MarketId:    position.MarketID,
		SelectionId: position.SelectionID,
		Side:        position.Side,
		Exposure:    position.Exposure,
		Pnl:         position.PnL,
		UpdatedAt:   position.UpdatedAt.Unix(),
	}
}

func toInsightMessage(insight *portfolio.AnalyticsInsight) *AnalyticsInsight {
	if insight == nil {
		return nil
	}
	return &AnalyticsInsight{
		MarketId:           insight.MarketID,
		SelectionId:        insight.SelectionID,
		ImpliedProbability: insight.ImpliedProbability,
		ExpectedValue:      insight.ExpectedValue,
		Momentum:           insight.Momentum,
		LastUpdated:        insight.LastUpdated.Unix(),
	}
}

func toMetricsMessage(metrics portfolio.PerformanceMetrics) *PerformanceMetrics {
	return &PerformanceMetrics{
		TotalStake:   metrics.TotalStake,
		TotalPayout:  metrics.TotalPayout,
		Roi:          metrics.ROI,
		OrdersPlaced: int32(metrics.OrdersPlaced),
		OrdersWon:    int32(metrics.OrdersWon),
	}
}
