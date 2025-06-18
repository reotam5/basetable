package ledger

import (
	"testing"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
)

func TestNewEntry(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	entryType := EntryTypePayment
	operation := OperationAdd
	sourceID := "payment-123"
	amount := account.HydrateAmount(1000)
	metadata := map[string]any{"test": "value"}

	entry := NewEntry(accountID, userID, entryType, operation, sourceID, amount, metadata)

	if entry.AccountID() != accountID {
		t.Errorf("Expected AccountID %v, got %v", accountID, entry.AccountID())
	}

	if entry.UserID() != userID {
		t.Errorf("Expected UserID %s, got %s", userID, entry.UserID())
	}

	if entry.Type() != entryType {
		t.Errorf("Expected Type %v, got %v", entryType, entry.Type())
	}

	if entry.Operation() != operation {
		t.Errorf("Expected Operation %v, got %v", operation, entry.Operation())
	}

	if entry.SourceID() != sourceID {
		t.Errorf("Expected SourceID %s, got %s", sourceID, entry.SourceID())
	}

	if !entry.Amount().Equals(amount) {
		t.Errorf("Expected Amount %v, got %v", amount, entry.Amount())
	}

	if len(entry.Metadata()) != len(metadata) {
		t.Errorf("Expected metadata length %d, got %d", len(metadata), len(entry.Metadata()))
	}

	if entry.Metadata()["test"] != "value" {
		t.Errorf("Expected metadata test value 'value', got %v", entry.Metadata()["test"])
	}

	if entry.ID().String() == "" {
		t.Error("Expected ID to be generated")
	}

	if entry.CreatedAt().IsZero() {
		t.Error("Expected CreatedAt to be set")
	}
}

func TestHydrateEntry(t *testing.T) {
	id := "entry-123"
	accountID := "account-456"
	userID := "user123"
	entryType := "PAYMENT"
	operation := "ADD"
	sourceID := "payment-123"
	amount := int64(1500)
	metadata := map[string]any{"test": "value"}
	createdAt := time.Now().Add(-time.Hour)

	entry := HydrateEntry(id, accountID, userID, entryType, operation, sourceID, amount, metadata, createdAt)

	if entry.ID().String() != id {
		t.Errorf("Expected ID %s, got %s", id, entry.ID().String())
	}

	if entry.AccountID().String() != accountID {
		t.Errorf("Expected AccountID %s, got %s", accountID, entry.AccountID().String())
	}

	if entry.UserID() != userID {
		t.Errorf("Expected UserID %s, got %s", userID, entry.UserID())
	}

	if entry.Type().String() != entryType {
		t.Errorf("Expected Type %s, got %s", entryType, entry.Type().String())
	}

	if entry.Operation().String() != operation {
		t.Errorf("Expected Operation %s, got %s", operation, entry.Operation().String())
	}

	if entry.SourceID() != sourceID {
		t.Errorf("Expected SourceID %s, got %s", sourceID, entry.SourceID())
	}

	if entry.Amount().Value() != amount {
		t.Errorf("Expected Amount %d, got %d", amount, entry.Amount().Value())
	}

	if !entry.CreatedAt().Equal(createdAt) {
		t.Errorf("Expected CreatedAt %v, got %v", createdAt, entry.CreatedAt())
	}

	if entry.Metadata()["test"] != "value" {
		t.Errorf("Expected metadata test value 'value', got %v", entry.Metadata()["test"])
	}
}

func TestEntryTypeValues(t *testing.T) {
	tests := []struct {
		name     string
		entryType EntryType
		expected string
	}{
		{"Payment", EntryTypePayment, "PAYMENT"},
		{"Reservation", EntryTypeReservation, "RESERVATION"},
		{"Adjustment", EntryTypeAdjustment, "ADJUSTMENT"},
		{"Manual", EntryTypeManual, "MANUAL"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if tt.entryType.String() != tt.expected {
				t.Errorf("Expected %s, got %s", tt.expected, tt.entryType.String())
			}
		})
	}
}

func TestLedgerEntryString(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	entryType := EntryTypePayment
	operation := OperationAdd
	sourceID := "payment-123"
	amount := account.HydrateAmount(1000)
	metadata := map[string]any{}

	entry := NewEntry(accountID, userID, entryType, operation, sourceID, amount, metadata)
	str := entry.String()

	if str == "" {
		t.Error("Expected non-empty string representation")
	}

	// Should contain key information
	expectedSubstrings := []string{
		"LedgerEntry",
		entry.ID().String(),
		accountID.String(),
		userID,
		entryType.String(),
		sourceID,
	}

	for _, substr := range expectedSubstrings {
		if !containsString(str, substr) {
			t.Errorf("Expected string to contain '%s', got '%s'", substr, str)
		}
	}
}

func TestLedgerEntryWithNilMetadata(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	entryType := EntryTypePayment
	operation := OperationAdd
	sourceID := "payment-123"
	amount := account.HydrateAmount(1000)

	entry := NewEntry(accountID, userID, entryType, operation, sourceID, amount, nil)

	// The function stores nil directly, so we expect nil
	if entry.Metadata() != nil {
		t.Errorf("Expected Metadata() to return nil for nil input, got %v", entry.Metadata())
	}
}

func TestLedgerEntryWithEmptyMetadata(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	entryType := EntryTypePayment
	operation := OperationAdd
	sourceID := "payment-123"
	amount := account.HydrateAmount(1000)
	metadata := map[string]any{}

	entry := NewEntry(accountID, userID, entryType, operation, sourceID, amount, metadata)

	if len(entry.Metadata()) != 0 {
		t.Errorf("Expected empty metadata, got length %d", len(entry.Metadata()))
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