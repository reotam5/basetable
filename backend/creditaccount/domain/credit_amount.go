package domain

import (
	"fmt"
)

// creditAmount represents a credit balance in cents (1 credit = $0.01)
type creditAmount int64

const (
	MinCreditAmount = 0
)

func NewCreditAmount(value int64) (creditAmount, error) {
	if value < MinCreditAmount {
		return creditAmount(0), NewInvalidCreditAmountError(value)
	}

	return creditAmount(value), nil
}

func (c creditAmount) Value() int64 {
	return int64(c)
}

func (c creditAmount) String() string {
	return fmt.Sprintf("%d credits", c.Value())
}

func (c creditAmount) Add(other creditAmount) creditAmount {
	return c + other
}

func (c creditAmount) Subtract(other creditAmount) (creditAmount, error) {
	if c < other {
		return 0, NewInsufficientCreditsError(int64(c), int64(other))
	}
	return c - other, nil
}

func (c creditAmount) IsZero() bool {
	return c == 0
}

func (c creditAmount) Equals(other creditAmount) bool {
	return c == other
}

func (c creditAmount) Dollars() float64 {
	return float64(c) / 100.0
}
