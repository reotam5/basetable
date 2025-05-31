package domain

import (
	"testing"
)

func TestNewCurrencyFromString(t *testing.T) {
	h := NewTestHelpers(t)

	// Test valid currencies
	for _, validCurrency := range CommonTestData.ValidCurrencyStrings() {
		t.Run("valid_currency_"+validCurrency, func(t *testing.T) {
			result, err := NewCurrencyFromString(validCurrency)
			h.AssertNoError(err)
			h.AssertEqual(result, CurrencyUSD)
		})
	}

	// Test invalid currencies
	for _, invalidCurrency := range CommonTestData.InvalidCurrencyStrings() {
		t.Run("invalid_currency_"+invalidCurrency, func(t *testing.T) {
			_, err := NewCurrencyFromString(invalidCurrency)
			h.AssertInvalidCurrencyError(err)
		})
	}
}

func TestCurrencyString(t *testing.T) {
	h := NewTestHelpers(t)
	h.AssertEqual(CurrencyUSD.String(), "USD")
}

func TestNewAmount(t *testing.T) {
	h := NewTestHelpers(t)

	tests := []struct {
		name    string
		value   int64
		wantErr bool
	}{
		{"valid_minimum", MinValue, false},
		{"valid_maximum", MaxValue, false},
		{"valid_middle", 25000, false},
		{"below_minimum", MinValue - 1, true},
		{"above_maximum", MaxValue + 1, true},
		{"zero", 0, true},
		{"negative", -1000, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result, err := NewAmount(tt.value, CurrencyUSD)

			if tt.wantErr {
				h.AssertInvalidAmountError(err)
				return
			}

			h.AssertNoError(err)
			h.AssertEqual(result.Value(), tt.value)
			h.AssertEqual(result.Currency(), CurrencyUSD)
		})
	}
}

func TestAmountGetters(t *testing.T) {
	h := NewTestHelpers(t)
	amount := NewAmountBuilder().WithValue(12500).MustBuild()

	h.AssertEqual(amount.Value(), int64(12500))
	h.AssertEqual(amount.Currency(), CurrencyUSD)
}

func TestAmountDollars(t *testing.T) {
	tests := []struct {
		name     string
		value    int64
		expected float64
	}{
		{"whole_dollars", 10000, 100.00},
		{"with_cents", 12550, 125.50},
		{"minimum_amount", MinValue, 10.00},
		{"maximum_amount", MaxValue, 500.00},
		{"small_amount", 1050, 10.50},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTestHelpers(t)
			amount := NewAmountBuilder().WithValue(tt.value).MustBuild()
			h.AssertEqual(amount.Dollars(), tt.expected)
		})
	}
}

func TestAmountString(t *testing.T) {
	tests := []struct {
		name     string
		value    int64
		expected string
	}{
		{"whole_dollars", 10000, "100.00 USD"},
		{"with_cents", 12550, "125.50 USD"},
		{"minimum_amount", MinValue, "10.00 USD"},
		{"maximum_amount", MaxValue, "500.00 USD"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTestHelpers(t)
			amount := NewAmountBuilder().WithValue(tt.value).MustBuild()
			h.AssertEqual(amount.String(), tt.expected)
		})
	}
}

func TestAmountEquals(t *testing.T) {
	h := NewTestHelpers(t)

	tests := []struct {
		name     string
		amount1  Amount
		amount2  Amount
		expected bool
	}{
		{
			name:     "equal_amounts",
			amount1:  NewAmountBuilder().WithValue(12500).MustBuild(),
			amount2:  NewAmountBuilder().WithValue(12500).MustBuild(),
			expected: true,
		},
		{
			name:     "different_amounts",
			amount1:  NewAmountBuilder().WithValue(12500).MustBuild(),
			amount2:  NewAmountBuilder().WithValue(15000).MustBuild(),
			expected: false,
		},
		{
			name:     "minimum_amounts",
			amount1:  NewAmountBuilder().AsMinimum().MustBuild(),
			amount2:  NewAmountBuilder().AsMinimum().MustBuild(),
			expected: true,
		},
		{
			name:     "maximum_amounts",
			amount1:  NewAmountBuilder().AsMaximum().MustBuild(),
			amount2:  NewAmountBuilder().AsMaximum().MustBuild(),
			expected: true,
		},
		{
			name:     "min_vs_max",
			amount1:  NewAmountBuilder().AsMinimum().MustBuild(),
			amount2:  NewAmountBuilder().AsMaximum().MustBuild(),
			expected: false,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := tt.amount1.Equals(tt.amount2)
			h.AssertEqual(result, tt.expected)

			// Test symmetry
			reverseResult := tt.amount2.Equals(tt.amount1)
			h.AssertEqual(reverseResult, tt.expected, "Amount.Equals should be symmetric")
		})
	}
}

func TestAmountBoundaryValues(t *testing.T) {
	h := NewTestHelpers(t)

	// Test exactly at boundaries
	_, err := NewAmount(MinValue, CurrencyUSD)
	h.AssertNoError(err, "minimum value should be valid")

	_, err = NewAmount(MaxValue, CurrencyUSD)
	h.AssertNoError(err, "maximum value should be valid")

	// Test just outside boundaries
	_, err = NewAmount(MinValue-1, CurrencyUSD)
	h.AssertInvalidAmountError(err, "below minimum should be invalid")

	_, err = NewAmount(MaxValue+1, CurrencyUSD)
	h.AssertInvalidAmountError(err, "above maximum should be invalid")
}

func TestAmountBuilder(t *testing.T) {
	h := NewTestHelpers(t)

	// Test builder with defaults
	amount := NewAmountBuilder().MustBuild()
	h.AssertEqual(amount.Value(), int64(15000))
	h.AssertEqual(amount.Currency(), CurrencyUSD)

	// Test builder with custom values
	amount = NewAmountBuilder().
		WithValue(25000).
		WithCurrency(CurrencyUSD).
		MustBuild()
	h.AssertEqual(amount.Value(), int64(25000))

	// Test builder with dollars
	amount = NewAmountBuilder().WithDollars(123.45).MustBuild()
	h.AssertEqual(amount.Value(), int64(12345))
	h.AssertEqual(amount.Dollars(), 123.45)

	// Test builder convenience methods
	minAmount := NewAmountBuilder().AsMinimum().MustBuild()
	h.AssertEqual(minAmount.Value(), MinValue)

	maxAmount := NewAmountBuilder().AsMaximum().MustBuild()
	h.AssertEqual(maxAmount.Value(), MaxValue)
}

func TestAmountBuilderErrors(t *testing.T) {
	h := NewTestHelpers(t)

	// Test builder with invalid values
	_, err := NewAmountBuilder().WithValue(MinValue - 1).Build()
	h.AssertInvalidAmountError(err)

	_, err = NewAmountBuilder().WithValue(MaxValue + 1).Build()
	h.AssertInvalidAmountError(err)
}
