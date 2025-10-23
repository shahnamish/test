package portfolio

import (
	"database/sql"
	"fmt"
	"time"
)

// Repository defines persistence operations for orders and positions.
type Repository interface {
	CreateOrder(order *Order) error
	GetOrderByID(orderID string) (*Order, error)
	GetOpenOrdersByUser(userID string) ([]Order, error)
	UpdateOrderStatus(orderID string, status OrderStatus, payout float64, settledAt *time.Time) error
	CreateOrUpdatePosition(position *Position) error
	GetPosition(userID, marketID, selectionID string) (*Position, error)
	GetPositionsByUser(userID string) ([]Position, error)
	GetPerformanceMetrics(userID string) (*PerformanceMetrics, error)
}

// PostgresRepository implements Repository with a Postgres backend.
type PostgresRepository struct {
	db *sql.DB
}

// NewPostgresRepository creates a new PostgresRepository.
func NewPostgresRepository(db *sql.DB) *PostgresRepository {
	return &PostgresRepository{db: db}
}

// CreateOrder inserts a new order into the database.
func (r *PostgresRepository) CreateOrder(order *Order) error {
	query := `
		INSERT INTO orders (id, user_id, market_id, selection_id, side, stake, odds, status, payout, created_at, settled_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
	`
	_, err := r.db.Exec(query,
		order.ID, order.UserID, order.MarketID, order.SelectionID,
		order.Side, order.Stake, order.Odds, order.Status, order.Payout,
		order.CreatedAt, order.SettledAt,
	)
	return err
}

// GetOrderByID retrieves a single order by its identifier.
func (r *PostgresRepository) GetOrderByID(orderID string) (*Order, error) {
	query := `
		SELECT id, user_id, market_id, selection_id, side, stake, odds, status, payout, created_at, settled_at
		FROM orders
		WHERE id = $1
	`
	order := &Order{}
	err := r.db.QueryRow(query, orderID).Scan(
		&order.ID, &order.UserID, &order.MarketID, &order.SelectionID,
		&order.Side, &order.Stake, &order.Odds, &order.Status, &order.Payout,
		&order.CreatedAt, &order.SettledAt,
	)
	if err == sql.ErrNoRows {
		return nil, fmt.Errorf("order not found: %s", orderID)
	}
	if err != nil {
		return nil, err
	}
	return order, nil
}

// GetOpenOrdersByUser retrieves all open orders for a given user.
func (r *PostgresRepository) GetOpenOrdersByUser(userID string) ([]Order, error) {
	query := `
		SELECT id, user_id, market_id, selection_id, side, stake, odds, status, payout, created_at, settled_at
		FROM orders
		WHERE user_id = $1 AND status = $2
		ORDER BY created_at DESC
	`
	rows, err := r.db.Query(query, userID, OrderStatusOpen)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var orders []Order
	for rows.Next() {
		var order Order
		err := rows.Scan(
			&order.ID, &order.UserID, &order.MarketID, &order.SelectionID,
			&order.Side, &order.Stake, &order.Odds, &order.Status, &order.Payout,
			&order.CreatedAt, &order.SettledAt,
		)
		if err != nil {
			return nil, err
		}
		orders = append(orders, order)
	}
	return orders, rows.Err()
}

// UpdateOrderStatus marks an order as settled and updates the payout.
func (r *PostgresRepository) UpdateOrderStatus(orderID string, status OrderStatus, payout float64, settledAt *time.Time) error {
	query := `
		UPDATE orders
		SET status = $2, payout = $3, settled_at = $4
		WHERE id = $1
	`
	_, err := r.db.Exec(query, orderID, status, payout, settledAt)
	return err
}

// CreateOrUpdatePosition upserts a position for a user, market, and selection.
func (r *PostgresRepository) CreateOrUpdatePosition(position *Position) error {
	query := `
		INSERT INTO positions (user_id, market_id, selection_id, side, exposure, pnl, updated_at)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (user_id, market_id, selection_id)
		DO UPDATE SET
			side = EXCLUDED.side,
			exposure = EXCLUDED.exposure,
			pnl = EXCLUDED.pnl,
			updated_at = EXCLUDED.updated_at
	`
	_, err := r.db.Exec(query,
		position.UserID, position.MarketID, position.SelectionID,
		position.Side, position.Exposure, position.PnL, position.UpdatedAt,
	)
	return err
}

// GetPosition fetches the position for a specific user, market, and selection.
func (r *PostgresRepository) GetPosition(userID, marketID, selectionID string) (*Position, error) {
	query := `
		SELECT user_id, market_id, selection_id, side, exposure, pnl, updated_at
		FROM positions
		WHERE user_id = $1 AND market_id = $2 AND selection_id = $3
	`
	position := &Position{}
	err := r.db.QueryRow(query, userID, marketID, selectionID).Scan(
		&position.UserID, &position.MarketID, &position.SelectionID,
		&position.Side, &position.Exposure, &position.PnL, &position.UpdatedAt,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	return position, nil
}

// GetPositionsByUser retrieves all positions belonging to a user.
func (r *PostgresRepository) GetPositionsByUser(userID string) ([]Position, error) {
	query := `
		SELECT user_id, market_id, selection_id, side, exposure, pnl, updated_at
		FROM positions
		WHERE user_id = $1
		ORDER BY updated_at DESC
	`
	rows, err := r.db.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var positions []Position
	for rows.Next() {
		var position Position
		err := rows.Scan(
			&position.UserID, &position.MarketID, &position.SelectionID,
			&position.Side, &position.Exposure, &position.PnL, &position.UpdatedAt,
		)
		if err != nil {
			return nil, err
		}
		positions = append(positions, position)
	}
	return positions, rows.Err()
}

// GetPerformanceMetrics computes aggregate performance metrics for a user.
func (r *PostgresRepository) GetPerformanceMetrics(userID string) (*PerformanceMetrics, error) {
	query := `
		SELECT
			COALESCE(SUM(stake), 0) as total_stake,
			COALESCE(SUM(payout), 0) as total_payout,
			COUNT(*) as orders_placed,
			COUNT(CASE WHEN payout > stake THEN 1 END) as orders_won
		FROM orders
		WHERE user_id = $1
	`
	metrics := &PerformanceMetrics{}
	var totalStake, totalPayout float64
	var ordersPlaced, ordersWon int

	err := r.db.QueryRow(query, userID).Scan(
		&totalStake, &totalPayout, &ordersPlaced, &ordersWon,
	)
	if err != nil {
		return nil, err
	}

	metrics.TotalStake = totalStake
	metrics.TotalPayout = totalPayout
	metrics.OrdersPlaced = ordersPlaced
	metrics.OrdersWon = ordersWon
	if totalStake > 0 {
		metrics.ROI = ((totalPayout - totalStake) / totalStake) * 100
	}

	return metrics, nil
}
