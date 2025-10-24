package portfolio

import "errors"

var (
	// ErrInvalidStake is returned when the stake is non-positive.
	ErrInvalidStake = errors.New("stake must be greater than zero")
	// ErrInvalidOdds is returned when the odds are non-positive.
	ErrInvalidOdds = errors.New("odds must be greater than 1.0")
	// ErrUnknownOrderSide is returned when an unsupported order side is provided.
	ErrUnknownOrderSide = errors.New("unknown order side")
	// ErrOrderNotFound is returned when an order cannot be located in the repository.
	ErrOrderNotFound = errors.New("order not found")
)
