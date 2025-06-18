package service

import (
	"testing"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
	"github.com/basetable/basetable/backend/internal/shared/domain"
)

func TestReserveCredits(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add some credits first
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)

	rsvt, ledgerEnt, err := service.ReserveCredits(acc, reserveAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if rsvt == nil {
		t.Error("Expected reservation to be created")
	}

	if ledgerEnt == nil {
		t.Error("Expected ledger entry to be created")
	}

	// Check reservation
	if rsvt.AccountID() != acc.ID() {
		t.Errorf("Expected reservation account ID %v, got %v", acc.ID(), rsvt.AccountID())
	}

	if rsvt.UserID() != acc.UserID() {
		t.Errorf("Expected reservation user ID %s, got %s", acc.UserID(), rsvt.UserID())
	}

	if !rsvt.Amount().Equals(reserveAmount) {
		t.Errorf("Expected reservation amount %v, got %v", reserveAmount, rsvt.Amount())
	}

	if !rsvt.IsPending() {
		t.Error("Expected reservation to be pending")
	}

	// Check ledger entry
	if ledgerEnt.AccountID() != acc.ID() {
		t.Errorf("Expected ledger entry account ID %v, got %v", acc.ID(), ledgerEnt.AccountID())
	}

	if ledgerEnt.Type() != ledger.EntryTypeReservation {
		t.Errorf("Expected ledger entry type %v, got %v", ledger.EntryTypeReservation, ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationDeduct {
		t.Errorf("Expected ledger entry operation %v, got %v", ledger.OperationDeduct, ledgerEnt.Operation())
	}

	if !ledgerEnt.Amount().Equals(reserveAmount) {
		t.Errorf("Expected ledger entry amount %v, got %v", reserveAmount, ledgerEnt.Amount())
	}

	// Check account balance was deducted
	expectedBalance, _ := account.NewAmount(500) // 1000 - 500
	if !acc.Balance().Equals(expectedBalance) {
		t.Errorf("Expected account balance %v, got %v", expectedBalance, acc.Balance())
	}
}

func TestReserveCreditsInsufficientBalance(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123") // starts with 0 balance

	reserveAmount, _ := account.NewAmount(500)

	rsvt, ledgerEnt, err := service.ReserveCredits(acc, reserveAmount)

	if err == nil {
		t.Error("Expected insufficient amount error")
	}

	if !domain.IsErrorType(err, account.ErrorTypeInsufficientAmount) {
		t.Errorf("Expected insufficient amount error, got %v", err)
	}

	if rsvt != nil {
		t.Error("Expected no reservation to be created")
	}

	if ledgerEnt != nil {
		t.Error("Expected no ledger entry to be created")
	}
}

func TestCommitReservationExactAmount(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add credits and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc, reserveAmount)

	// Commit with exact amount
	actualAmount := reserveAmount
	ledgerEnt, err := service.CommitReservation(acc, rsvt, actualAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	// Should return nil ledger entry for exact amount (no adjustment needed)
	if ledgerEnt != nil {
		t.Error("Expected no ledger entry for exact amount")
	}

	if !rsvt.IsCommitted() {
		t.Error("Expected reservation to be committed")
	}

	if !rsvt.Amount().Equals(actualAmount) {
		t.Errorf("Expected reservation amount %v, got %v", actualAmount, rsvt.Amount())
	}
}

func TestCommitReservationWithRefund(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add credits and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc, reserveAmount)

	// Commit with less amount (refund scenario)
	actualAmount, _ := account.NewAmount(300)
	ledgerEnt, err := service.CommitReservation(acc, rsvt, actualAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt == nil {
		t.Error("Expected ledger entry for refund")
	}

	if ledgerEnt.Type() != ledger.EntryTypeAdjustment {
		t.Errorf("Expected adjustment type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationAdd {
		t.Errorf("Expected add operation for refund, got %v", ledgerEnt.Operation())
	}

	expectedRefund, _ := account.NewAmount(200) // 500 - 300
	if !ledgerEnt.Amount().Equals(expectedRefund) {
		t.Errorf("Expected refund amount %v, got %v", expectedRefund, ledgerEnt.Amount())
	}

	if ledgerEnt.Metadata()["type"] != "refund" {
		t.Errorf("Expected metadata type 'refund', got %v", ledgerEnt.Metadata()["type"])
	}

	// Check account balance
	// Initial: 1000, Reserved: 500 (balance became 500), Actual used: 300, Refund: 200
	// Final balance: 500 + 200 = 700
	expectedBalance, _ := account.NewAmount(700)
	if !acc.Balance().Equals(expectedBalance) {
		t.Errorf("Expected account balance %v, got %v", expectedBalance, acc.Balance())
	}
}

func TestCommitReservationWithSurcharge(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add credits and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc, reserveAmount)

	// Commit with more amount (surcharge scenario)
	actualAmount, _ := account.NewAmount(700)
	ledgerEnt, err := service.CommitReservation(acc, rsvt, actualAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt == nil {
		t.Error("Expected ledger entry for surcharge")
	}

	if ledgerEnt.Type() != ledger.EntryTypeAdjustment {
		t.Errorf("Expected adjustment type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationDeduct {
		t.Errorf("Expected deduct operation for surcharge, got %v", ledgerEnt.Operation())
	}

	expectedSurcharge, _ := account.NewAmount(200) // 700 - 500
	if !ledgerEnt.Amount().Equals(expectedSurcharge) {
		t.Errorf("Expected surcharge amount %v, got %v", expectedSurcharge, ledgerEnt.Amount())
	}

	if ledgerEnt.Metadata()["type"] != "surcharge" {
		t.Errorf("Expected metadata type 'surcharge', got %v", ledgerEnt.Metadata()["type"])
	}
}

func TestCommitReservationAccountMismatch(t *testing.T) {
	service := &BillingService{}
	acc1 := account.New("user123")
	acc2 := account.New("user456")

	// Add credits to acc1 and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc1.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc1, reserveAmount)

	// Try to commit with different account
	actualAmount := reserveAmount
	_, err := service.CommitReservation(acc2, rsvt, actualAmount)

	if err == nil {
		t.Error("Expected account ID mismatch error")
	}

	// Check if it's the correct error type
	if !containsError(err.Error(), "Account ID mismatch") {
		t.Errorf("Expected account ID mismatch error, got %v", err)
	}
}

func TestCommitReservationAlreadyFinalized(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add credits and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc, reserveAmount)

	// Commit first time
	actualAmount := reserveAmount
	service.CommitReservation(acc, rsvt, actualAmount)

	// Try to commit again
	_, err := service.CommitReservation(acc, rsvt, actualAmount)

	if err == nil {
		t.Error("Expected already finalized error")
	}

	if !reservation.IsAlreadyFinalizedError(err) {
		t.Errorf("Expected already finalized error, got %v", err)
	}
}

func TestReleaseReservation(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add credits and create reservation
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	reserveAmount, _ := account.NewAmount(500)
	rsvt, _, _ := service.ReserveCredits(acc, reserveAmount)

	ledgerEnt, err := service.ReleaseReservation(acc, rsvt)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt == nil {
		t.Error("Expected ledger entry for release")
	}

	if ledgerEnt.Type() != ledger.EntryTypeAdjustment {
		t.Errorf("Expected adjustment type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationAdd {
		t.Errorf("Expected add operation for release, got %v", ledgerEnt.Operation())
	}

	if !ledgerEnt.Amount().Equals(reserveAmount) {
		t.Errorf("Expected release amount %v, got %v", reserveAmount, ledgerEnt.Amount())
	}

	if ledgerEnt.Metadata()["type"] != "release" {
		t.Errorf("Expected metadata type 'release', got %v", ledgerEnt.Metadata()["type"])
	}

	if !rsvt.IsReleased() {
		t.Error("Expected reservation to be released")
	}

	// Check account balance restored
	if !acc.Balance().Equals(initialAmount) {
		t.Errorf("Expected account balance restored to %v, got %v", initialAmount, acc.Balance())
	}
}

func TestAddPaymentCredits(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	amount, _ := account.NewAmount(500)
	paymentID := "payment-123"
	metadata := map[string]any{"source": "stripe"}

	ledgerEnt, err := service.AddPaymentCredits(acc, amount, paymentID, metadata)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt == nil {
		t.Error("Expected ledger entry to be created")
	}

	if ledgerEnt.Type() != ledger.EntryTypePayment {
		t.Errorf("Expected payment type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationAdd {
		t.Errorf("Expected add operation, got %v", ledgerEnt.Operation())
	}

	if ledgerEnt.SourceID() != paymentID {
		t.Errorf("Expected source ID %s, got %s", paymentID, ledgerEnt.SourceID())
	}

	if !ledgerEnt.Amount().Equals(amount) {
		t.Errorf("Expected amount %v, got %v", amount, ledgerEnt.Amount())
	}

	if !acc.Balance().Equals(amount) {
		t.Errorf("Expected account balance %v, got %v", amount, acc.Balance())
	}
}

func TestAddManualCredits(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	amount, _ := account.NewAmount(500)
	adminID := "admin-123"
	metadata := map[string]any{"reason": "compensation"}

	ledgerEnt, err := service.AddManualCredits(acc, amount, adminID, metadata)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt.Type() != ledger.EntryTypeManual {
		t.Errorf("Expected manual type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationAdd {
		t.Errorf("Expected add operation, got %v", ledgerEnt.Operation())
	}

	if ledgerEnt.SourceID() != adminID {
		t.Errorf("Expected source ID %s, got %s", adminID, ledgerEnt.SourceID())
	}
}

func TestDeductManualCredits(t *testing.T) {
	service := &BillingService{}
	acc := account.New("user123")

	// Add some credits first
	initialAmount, _ := account.NewAmount(1000)
	acc.AddCredits(initialAmount)

	deductAmount, _ := account.NewAmount(300)
	adminID := "admin-123"
	metadata := map[string]any{"reason": "penalty"}

	ledgerEnt, err := service.DeductManualCredits(acc, deductAmount, adminID, metadata)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if ledgerEnt.Type() != ledger.EntryTypeManual {
		t.Errorf("Expected manual type, got %v", ledgerEnt.Type())
	}

	if ledgerEnt.Operation() != ledger.OperationDeduct {
		t.Errorf("Expected deduct operation, got %v", ledgerEnt.Operation())
	}

	expectedBalance, _ := account.NewAmount(700) // 1000 - 300
	if !acc.Balance().Equals(expectedBalance) {
		t.Errorf("Expected account balance %v, got %v", expectedBalance, acc.Balance())
	}
}

func containsError(s, substr string) bool {
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
