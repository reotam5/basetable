package account

import (
	"math"
	"testing"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

func TestNewAmount(t *testing.T) {
	tests := []struct {
		name        string
		value       int64
		expectError bool
	}{
		{"Valid amount zero", 0, false},
		{"Valid amount positive", 1000, false},
		{"Valid amount max", MaxAmount, false},
		{"Invalid amount negative", -1, true},
		{"Invalid amount below min", MinAmount - 1, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			amount, err := NewAmount(tt.value)

			if tt.expectError {
				if err == nil {
					t.Error("Expected error but got none")
				}
				if !domain.IsErrorType(err, ErrorTypeInvalidAmount) {
					t.Errorf("Expected invalid amount error, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				if amount.Value() != tt.value {
					t.Errorf("Expected value %d, got %d", tt.value, amount.Value())
				}
			}
		})
	}
}

func TestHydrateAmount(t *testing.T) {
	value := int64(1500)
	amount := HydrateAmount(value)

	if amount.Value() != value {
		t.Errorf("Expected value %d, got %d", value, amount.Value())
	}
}

func TestAmountAdd(t *testing.T) {
	tests := []struct {
		name        string
		a           int64
		b           int64
		expected    int64
		expectError bool
	}{
		{"Add zero", 100, 0, 100, false},
		{"Add positive", 100, 200, 300, false},
		{"Add to zero", 0, 100, 100, false},
		{"Overflow", math.MaxInt64, 1, 0, true},
		{"Near overflow", math.MaxInt64 - 1, 1, math.MaxInt64, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := HydrateAmount(tt.a)
			b := HydrateAmount(tt.b)

			result, err := a.Add(b)

			if tt.expectError {
				if err == nil {
					t.Error("Expected overflow error but got none")
				}
				if !domain.IsErrorType(err, ErrorTypeOverflow) {
					t.Errorf("Expected overflow error, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				if result.Value() != tt.expected {
					t.Errorf("Expected result %d, got %d", tt.expected, result.Value())
				}
			}
		})
	}
}

func TestAmountSubtract(t *testing.T) {
	tests := []struct {
		name        string
		a           int64
		b           int64
		expected    int64
		expectError bool
	}{
		{"Subtract zero", 100, 0, 100, false},
		{"Subtract smaller", 100, 50, 50, false},
		{"Subtract equal", 100, 100, 0, false},
		{"Subtract larger", 100, 150, 0, true},
		{"Subtract from zero", 0, 1, 0, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := HydrateAmount(tt.a)
			b := HydrateAmount(tt.b)

			result, err := a.Subtract(b)

			if tt.expectError {
				if err == nil {
					t.Error("Expected insufficient amount error but got none")
				}
				if !domain.IsErrorType(err, ErrorTypeInsufficientAmount) {
					t.Errorf("Expected insufficient amount error, got %v", err)
				}
			} else {
				if err != nil {
					t.Errorf("Expected no error, got %v", err)
				}
				if result.Value() != tt.expected {
					t.Errorf("Expected result %d, got %d", tt.expected, result.Value())
				}
			}
		})
	}
}

func TestAmountIsZero(t *testing.T) {
	tests := []struct {
		name     string
		value    int64
		expected bool
	}{
		{"Zero", 0, true},
		{"Positive", 100, false},
		{"Large", 999999, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			amount := HydrateAmount(tt.value)
			result := amount.IsZero()

			if result != tt.expected {
				t.Errorf("Expected IsZero() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestAmountEquals(t *testing.T) {
	tests := []struct {
		name     string
		a        int64
		b        int64
		expected bool
	}{
		{"Equal zero", 0, 0, true},
		{"Equal positive", 100, 100, true},
		{"Not equal", 100, 200, false},
		{"Zero vs positive", 0, 100, false},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			a := HydrateAmount(tt.a)
			b := HydrateAmount(tt.b)
			result := a.Equals(b)

			if result != tt.expected {
				t.Errorf("Expected Equals() %v, got %v", tt.expected, result)
			}
		})
	}
}

func TestAmountDollars(t *testing.T) {
	tests := []struct {
		name     string
		cents    int64
		expected float64
	}{
		{"Zero", 0, 0.0},
		{"One dollar", 100, 1.0},
		{"Fifty cents", 50, 0.5},
		{"Ten dollars fifty", 1050, 10.5},
		{"Large amount", 999999, 9999.99},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			amount := HydrateAmount(tt.cents)
			result := amount.Dollars()

			if result != tt.expected {
				t.Errorf("Expected Dollars() %.2f, got %.2f", tt.expected, result)
			}
		})
	}
}

func TestAmountString(t *testing.T) {
	tests := []struct {
		name     string
		cents    int64
		contains []string
	}{
		{"Zero", 0, []string{"$0.00", "0 credits"}},
		{"One dollar", 100, []string{"$1.00", "100 credits"}},
		{"Fifty cents", 50, []string{"$0.50", "50 credits"}},
		{"Large amount", 123456, []string{"$1234.56", "123456 credits"}},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			amount := HydrateAmount(tt.cents)
			result := amount.String()

			for _, substr := range tt.contains {
				if !containsString(result, substr) {
					t.Errorf("Expected string to contain '%s', got '%s'", substr, result)
				}
			}
		})
	}
}

func containsString(s, substr string) bool {
	if len(substr) > len(s) {
		return false
	}
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
