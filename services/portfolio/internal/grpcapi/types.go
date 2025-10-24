package grpcapi

import (
	"context"

	"github.com/portfolio-service/internal/portfolio"
	"google.golang.org/grpc"
)

// PlaceOrderRequest is the gRPC request to place an order.
type PlaceOrderRequest struct {
	UserId      string              `json:"user_id"`
	MarketId    string              `json:"market_id"`
	SelectionId string              `json:"selection_id"`
	Side        portfolio.OrderSide `json:"side"`
	Stake       float64             `json:"stake"`
	Odds        float64             `json:"odds"`
}

// PlaceOrderResponse is the gRPC response after placing an order.
type PlaceOrderResponse struct {
	Order    *Order            `json:"order"`
	Position *Position         `json:"position"`
	Insight  *AnalyticsInsight `json:"insight,omitempty"`
}

// SettleOrderRequest is the gRPC request to settle an order.
type SettleOrderRequest struct {
	OrderId string  `json:"order_id"`
	Won     bool    `json:"won"`
	Payout  float64 `json:"payout"`
}

// SettleOrderResponse is the gRPC response after settling an order.
type SettleOrderResponse struct {
	Order    *Order              `json:"order"`
	Position *Position           `json:"position"`
	Metrics  *PerformanceMetrics `json:"metrics"`
}

// ListOpenPositionsRequest is the gRPC request to list positions.
type ListOpenPositionsRequest struct {
	UserId string `json:"user_id"`
}

// ListOpenPositionsResponse is the gRPC response containing positions.
type ListOpenPositionsResponse struct {
	Positions []*Position `json:"positions"`
}

// GetPerformanceMetricsRequest is the gRPC request to get user metrics.
type GetPerformanceMetricsRequest struct {
	UserId string `json:"user_id"`
}

// GetPerformanceMetricsResponse is the gRPC response with metrics.
type GetPerformanceMetricsResponse struct {
	Metrics *PerformanceMetrics `json:"metrics"`
}

// Order is the gRPC representation of an order.
type Order struct {
	Id          string              `json:"id"`
	UserId      string              `json:"user_id"`
	MarketId    string              `json:"market_id"`
	SelectionId string              `json:"selection_id"`
	Side        portfolio.OrderSide `json:"side"`
	Stake       float64             `json:"stake"`
	Odds        float64             `json:"odds"`
	Status      string              `json:"status"`
	Payout      float64             `json:"payout"`
	CreatedAt   int64               `json:"created_at"`
	SettledAt   *int64              `json:"settled_at,omitempty"`
}

// Position is the gRPC representation of a position.
type Position struct {
	UserId      string              `json:"user_id"`
	MarketId    string              `json:"market_id"`
	SelectionId string              `json:"selection_id"`
	Side        portfolio.OrderSide `json:"side"`
	Exposure    float64             `json:"exposure"`
	Pnl         float64             `json:"pnl"`
	UpdatedAt   int64               `json:"updated_at"`
}

// AnalyticsInsight is the gRPC representation of analytics insight.
type AnalyticsInsight struct {
	MarketId           string  `json:"market_id"`
	SelectionId        string  `json:"selection_id"`
	ImpliedProbability float64 `json:"implied_probability"`
	ExpectedValue      float64 `json:"expected_value"`
	Momentum           float64 `json:"momentum"`
	LastUpdated        int64   `json:"last_updated"`
}

// PerformanceMetrics is the gRPC representation of metrics.
type PerformanceMetrics struct {
	TotalStake   float64 `json:"total_stake"`
	TotalPayout  float64 `json:"total_payout"`
	Roi          float64 `json:"roi"`
	OrdersPlaced int32   `json:"orders_placed"`
	OrdersWon    int32   `json:"orders_won"`
}

// _PortfolioService_serviceDesc is the gRPC service description.
var _PortfolioService_serviceDesc = grpc.ServiceDesc{
	ServiceName: "portfolio.PortfolioService",
	HandlerType: (*PortfolioServiceServer)(nil),
	Methods: []grpc.MethodDesc{
		{
			MethodName: "PlaceOrder",
			Handler:    _PortfolioService_PlaceOrder_Handler,
		},
		{
			MethodName: "SettleOrder",
			Handler:    _PortfolioService_SettleOrder_Handler,
		},
		{
			MethodName: "ListOpenPositions",
			Handler:    _PortfolioService_ListOpenPositions_Handler,
		},
		{
			MethodName: "GetPerformanceMetrics",
			Handler:    _PortfolioService_GetPerformanceMetrics_Handler,
		},
	},
	Streams:  []grpc.StreamDesc{},
	Metadata: "portfolio.proto",
}

func _PortfolioService_PlaceOrder_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(PlaceOrderRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PortfolioServiceServer).PlaceOrder(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/portfolio.PortfolioService/PlaceOrder",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PortfolioServiceServer).PlaceOrder(ctx, req.(*PlaceOrderRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PortfolioService_SettleOrder_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(SettleOrderRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PortfolioServiceServer).SettleOrder(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/portfolio.PortfolioService/SettleOrder",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PortfolioServiceServer).SettleOrder(ctx, req.(*SettleOrderRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PortfolioService_ListOpenPositions_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(ListOpenPositionsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PortfolioServiceServer).ListOpenPositions(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/portfolio.PortfolioService/ListOpenPositions",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PortfolioServiceServer).ListOpenPositions(ctx, req.(*ListOpenPositionsRequest))
	}
	return interceptor(ctx, in, info, handler)
}

func _PortfolioService_GetPerformanceMetrics_Handler(srv interface{}, ctx context.Context, dec func(interface{}) error, interceptor grpc.UnaryServerInterceptor) (interface{}, error) {
	in := new(GetPerformanceMetricsRequest)
	if err := dec(in); err != nil {
		return nil, err
	}
	if interceptor == nil {
		return srv.(PortfolioServiceServer).GetPerformanceMetrics(ctx, in)
	}
	info := &grpc.UnaryServerInfo{
		Server:     srv,
		FullMethod: "/portfolio.PortfolioService/GetPerformanceMetrics",
	}
	handler := func(ctx context.Context, req interface{}) (interface{}, error) {
		return srv.(PortfolioServiceServer).GetPerformanceMetrics(ctx, req.(*GetPerformanceMetricsRequest))
	}
	return interceptor(ctx, in, info, handler)
}
