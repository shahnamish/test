package httpapi

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"github.com/portfolio-service/internal/portfolio"
)

// Handler manages HTTP routes and endpoints.
type Handler struct {
	service *portfolio.Service
}

// NewHandler creates a Handler backed by a Service.
func NewHandler(service *portfolio.Service) *Handler {
	return &Handler{service: service}
}

// RegisterRoutes attaches handler methods to the Gin engine.
func (h *Handler) RegisterRoutes(r *gin.Engine) {
	api := r.Group("/api/v1")
	{
		api.POST("/orders", h.PlaceOrder)
		api.POST("/orders/:id/settle", h.SettleOrder)
		api.GET("/orders/open/:user_id", h.GetOpenOrders)
		api.GET("/positions/:user_id", h.GetPositions)
		api.GET("/metrics/:user_id", h.GetMetrics)
	}
}

type placeOrderRequest struct {
	UserID      string              `json:"user_id" binding:"required"`
	MarketID    string              `json:"market_id" binding:"required"`
	SelectionID string              `json:"selection_id" binding:"required"`
	Side        portfolio.OrderSide `json:"side" binding:"required"`
	Stake       float64             `json:"stake" binding:"required,gt=0"`
	Odds        float64             `json:"odds" binding:"required,gt=1"`
}

type settleOrderRequest struct {
	Won    bool    `json:"won" binding:"required"`
	Payout float64 `json:"payout" binding:"required,gte=0"`
}

// PlaceOrder handles POST /api/v1/orders.
func (h *Handler) PlaceOrder(c *gin.Context) {
	var req placeOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := portfolio.PlaceOrderInput{
		UserID:      req.UserID,
		MarketID:    req.MarketID,
		SelectionID: req.SelectionID,
		Side:        req.Side,
		Stake:       req.Stake,
		Odds:        req.Odds,
	}

	output, err := h.service.PlaceOrder(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusCreated, output)
}

// SettleOrder handles POST /api/v1/orders/:id/settle.
func (h *Handler) SettleOrder(c *gin.Context) {
	orderID := c.Param("id")

	var req settleOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	input := portfolio.SettleOrderInput{
		OrderID: orderID,
		Won:     req.Won,
		Payout:  req.Payout,
	}

	output, err := h.service.SettleOrder(c.Request.Context(), input)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, output)
}

// GetOpenOrders handles GET /api/v1/orders/open/:user_id.
func (h *Handler) GetOpenOrders(c *gin.Context) {
	userID := c.Param("user_id")

	orders, err := h.service.GetOpenOrders(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, orders)
}

// GetPositions handles GET /api/v1/positions/:user_id.
func (h *Handler) GetPositions(c *gin.Context) {
	userID := c.Param("user_id")

	positions, err := h.service.GetPositions(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, positions)
}

// GetMetrics handles GET /api/v1/metrics/:user_id.
func (h *Handler) GetMetrics(c *gin.Context) {
	userID := c.Param("user_id")

	metrics, err := h.service.GetPerformanceMetrics(c.Request.Context(), userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	c.JSON(http.StatusOK, metrics)
}
