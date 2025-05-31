package domain

import (
	"fmt"
	"strings"
)

type Currency struct {
	value string
}

var (
	CurrencyUSD = Currency{"USD"}
)

func NewCurrencyFromString(currencyStr string) (Currency, error) {
	normalized := strings.ToUpper(strings.TrimSpace(currencyStr))
	supportedCurrencies := []Currency{CurrencyUSD}
	for _, currency := range supportedCurrencies {
		if currency.value == normalized {
			return currency, nil
		}
	}
	return Currency{}, NewInvalidCurrencyError(currencyStr)

}

func (c Currency) String() string {
	return c.value
}

// Amount represents the amount in cents and the currency.
type Amount struct {
	value    int64
	currency Currency
}

const (
	MinValue = 1000  // Minimum top-up amount in cents (e.g., $10.00)
	MaxValue = 50000 // Maximum top-up amount in cents (e.g., $500.00)
)

func NewAmount(value int64, currency Currency) (Amount, error) {
	if value < MinValue || value > MaxValue {
		return Amount{}, NewInvalidAmountValueError(value)
	}

	return Amount{value: value, currency: currency}, nil
}

func (a Amount) Value() int64 {
	return a.value
}

func (a Amount) Currency() Currency {
	return a.currency
}

func (a Amount) Dollars() float64 {
	return float64(a.value) / 100.0
}

func (a Amount) String() string {
	return fmt.Sprintf("%.2f %s", a.Dollars(), a.currency)
}

func (a Amount) Equals(other Amount) bool {
	return a.value == other.value && a.currency == other.currency
}
