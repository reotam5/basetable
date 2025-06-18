package account

import (
	"testing"
	"time"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

func TestNew(t *testing.T) {
	userID := "user123"
	account := New(userID)

	if account.UserID() != userID {
		t.Errorf("Expected userID %s, got %s", userID, account.UserID())
	}

	if !account.Balance().IsZero() {
		t.Errorf("Expected balance to be zero, got %v", account.Balance())
	}

	if account.ID().String() == "" {
		t.Error("Expected ID to be generated")
	}

	if account.CreatedAt().IsZero() {
		t.Error("Expected CreatedAt to be set")
	}

	if account.UpdatedAt().IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}

	if !account.CreatedAt().Equal(account.UpdatedAt()) {
		t.Error("Expected CreatedAt and UpdatedAt to be equal for new account")
	}
}

func TestHydrate(t *testing.T) {
	id := "account-123"
	userID := "user123"
	balance := int64(1000)
	createdAt := time.Now().Add(-time.Hour)
	updatedAt := time.Now()

	account := Hydrate(id, userID, balance, createdAt, updatedAt)

	if account.ID().String() != id {
		t.Errorf("Expected ID %s, got %s", id, account.ID().String())
	}

	if account.UserID() != userID {
		t.Errorf("Expected userID %s, got %s", userID, account.UserID())
	}

	if account.Balance().Value() != balance {
		t.Errorf("Expected balance %d, got %d", balance, account.Balance().Value())
	}

	if !account.CreatedAt().Equal(createdAt) {
		t.Errorf("Expected CreatedAt %v, got %v", createdAt, account.CreatedAt())
	}

	if !account.UpdatedAt().Equal(updatedAt) {
		t.Errorf("Expected UpdatedAt %v, got %v", updatedAt, account.UpdatedAt())
	}
}

func TestAddCredits(t *testing.T) {
	account := New("user123")
	initialUpdatedAt := account.UpdatedAt()

	time.Sleep(time.Millisecond) // Ensure time difference

	amount, _ := NewAmount(500)
	err := account.AddCredits(amount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if account.Balance().Value() != 500 {
		t.Errorf("Expected balance 500, got %d", account.Balance().Value())
	}

	if !account.UpdatedAt().After(initialUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestAddCreditsOverflow(t *testing.T) {
	account := New("user123")

	// Set balance to near max
	maxAmount, _ := NewAmount(MaxAmount)
	account.balance = maxAmount

	// Try to add more
	additionalAmount, _ := NewAmount(1)
	err := account.AddCredits(additionalAmount)

	if err == nil {
		t.Error("Expected overflow error")
	}

	if !domain.IsErrorType(err, ErrorTypeOverflow) {
		t.Errorf("Expected overflow error, got %v", err)
	}
}

func TestDeductCredits(t *testing.T) {
	account := New("user123")

	// Add some credits first
	initialAmount, _ := NewAmount(1000)
	account.AddCredits(initialAmount)
	initialUpdatedAt := account.UpdatedAt()

	time.Sleep(time.Millisecond) // Ensure time difference

	deductAmount, _ := NewAmount(300)
	err := account.DeductCredits(deductAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if account.Balance().Value() != 700 {
		t.Errorf("Expected balance 700, got %d", account.Balance().Value())
	}

	if !account.UpdatedAt().After(initialUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestDeductCreditsInsufficientBalance(t *testing.T) {
	account := New("user123")

	// Try to deduct from zero balance
	deductAmount, _ := NewAmount(100)
	err := account.DeductCredits(deductAmount)

	if err == nil {
		t.Error("Expected insufficient amount error")
	}

	if !domain.IsErrorType(err, ErrorTypeInsufficientAmount) {
		t.Errorf("Expected insufficient amount error, got %v", err)
	}

	if !account.Balance().IsZero() {
		t.Errorf("Expected balance to remain zero, got %d", account.Balance().Value())
	}
}

func TestString(t *testing.T) {
	account := New("user123")
	str := account.String()

	if str == "" {
		t.Error("Expected non-empty string representation")
	}

	// Should contain key information
	if !contains(str, "Account") {
		t.Error("Expected string to contain 'Account'")
	}

	if !contains(str, account.ID().String()) {
		t.Error("Expected string to contain account ID")
	}

	if !contains(str, "user123") {
		t.Error("Expected string to contain user ID")
	}
}

func contains(s, substr string) bool {
	return len(s) >= len(substr) && s[len(s)-len(substr):] == substr ||
		len(s) > len(substr) && s[:len(substr)] == substr ||
		(len(s) > len(substr) && func() bool {
			for i := 0; i <= len(s)-len(substr); i++ {
				if s[i:i+len(substr)] == substr {
					return true
				}
			}
			return false
		}())
}
