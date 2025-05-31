package account

import (
	"fmt"
	"math"
)

// Amount represents a credit balance in cents (1 credit = $0.01)
type Amount struct {
	value int64
}

const (
	MinAmount = 0
	MaxAmount = math.MaxInt64
)

func NewAmount(value int64) (Amount, error) {
	if value < MinAmount || value > MaxAmount {
		return Amount{}, NewInvalidAmountError(value)
	}

	return Amount{value}, nil
}

func HydrateAmount(value int64) Amount {
	return Amount{value: value}
}

func (a Amount) Value() int64 {
	return a.value
}

func (a Amount) String() string {
	return fmt.Sprintf("$%.2f (%d credits)", a.Dollars(), a.value)
}

func (a Amount) Add(other Amount) (Amount, error) {
	if a.value > math.MaxInt64-other.value {
		return Amount{}, NewOverflowError(a.value, other.value)
	}
	return Amount{a.value + other.value}, nil
}

func (a Amount) Subtract(other Amount) (Amount, error) {
	if a.value < other.value {
		return Amount{}, NewInsufficientAmountError(a.value, other.value)
	}
	return Amount{a.value - other.value}, nil
}

func (a Amount) IsZero() bool {
	return a.value == 0
}

func (a Amount) Equals(other Amount) bool {
	return a.value == other.value
}

func (a Amount) Dollars() float64 {
	return float64(a.value) / 100.0
}
