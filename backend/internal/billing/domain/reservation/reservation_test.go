package reservation

import (
	"testing"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
)

func TestNew(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)

	reservation := New(accountID, userID, amount)

	if reservation.AccountID() != accountID {
		t.Errorf("Expected AccountID %v, got %v", accountID, reservation.AccountID())
	}

	if reservation.UserID() != userID {
		t.Errorf("Expected UserID %s, got %s", userID, reservation.UserID())
	}

	if !reservation.Amount().Equals(amount) {
		t.Errorf("Expected Amount %v, got %v", amount, reservation.Amount())
	}

	if !reservation.Status().IsPending() {
		t.Errorf("Expected status to be pending, got %v", reservation.Status())
	}

	if reservation.ID().String() == "" {
		t.Error("Expected ID to be generated")
	}

	if reservation.CreatedAt().IsZero() {
		t.Error("Expected CreatedAt to be set")
	}

	if reservation.UpdatedAt().IsZero() {
		t.Error("Expected UpdatedAt to be set")
	}

	if !reservation.CreatedAt().Equal(reservation.UpdatedAt()) {
		t.Error("Expected CreatedAt and UpdatedAt to be equal for new reservation")
	}
}

func TestHydrate(t *testing.T) {
	id := "reservation-123"
	accountID := "account-456"
	userID := "user123"
	amount := int64(1500)
	status := "COMMITED"
	createdAt := time.Now().Add(-time.Hour)
	updatedAt := time.Now()

	reservation := Hydrate(id, accountID, userID, amount, status, createdAt, updatedAt)

	if reservation.ID().String() != id {
		t.Errorf("Expected ID %s, got %s", id, reservation.ID().String())
	}

	if reservation.AccountID().String() != accountID {
		t.Errorf("Expected AccountID %s, got %s", accountID, reservation.AccountID().String())
	}

	if reservation.UserID() != userID {
		t.Errorf("Expected UserID %s, got %s", userID, reservation.UserID())
	}

	if reservation.Amount().Value() != amount {
		t.Errorf("Expected Amount %d, got %d", amount, reservation.Amount().Value())
	}

	if reservation.Status().String() != status {
		t.Errorf("Expected Status %s, got %s", status, reservation.Status().String())
	}

	if !reservation.CreatedAt().Equal(createdAt) {
		t.Errorf("Expected CreatedAt %v, got %v", createdAt, reservation.CreatedAt())
	}

	if !reservation.UpdatedAt().Equal(updatedAt) {
		t.Errorf("Expected UpdatedAt %v, got %v", updatedAt, reservation.UpdatedAt())
	}
}

func TestEnsurePending(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)

	// Test pending reservation
	pendingReservation := New(accountID, userID, amount)
	err := pendingReservation.EnsurePending()
	if err != nil {
		t.Errorf("Expected no error for pending reservation, got %v", err)
	}

	// Test committed reservation
	committedReservation := New(accountID, userID, amount)
	committedReservation.status = StatusCommited
	err = committedReservation.EnsurePending()
	if err == nil {
		t.Error("Expected error for committed reservation")
	}
	if !IsAlreadyFinalizedError(err) {
		t.Errorf("Expected AlreadyFinalizedError, got %v", err)
	}

	// Test released reservation
	releasedReservation := New(accountID, userID, amount)
	releasedReservation.status = StatusReleased
	err = releasedReservation.EnsurePending()
	if err == nil {
		t.Error("Expected error for released reservation")
	}
	if !IsAlreadyFinalizedError(err) {
		t.Errorf("Expected AlreadyFinalizedError, got %v", err)
	}
}

func TestStatusCheckers(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)

	reservation := New(accountID, userID, amount)

	// Test pending status
	if !reservation.IsPending() {
		t.Error("Expected new reservation to be pending")
	}
	if reservation.IsCommitted() {
		t.Error("Expected new reservation not to be committed")
	}
	if reservation.IsReleased() {
		t.Error("Expected new reservation not to be released")
	}
	if reservation.IsFinal() {
		t.Error("Expected new reservation not to be final")
	}

	// Test committed status
	reservation.status = StatusCommited
	if reservation.IsPending() {
		t.Error("Expected committed reservation not to be pending")
	}
	if !reservation.IsCommitted() {
		t.Error("Expected committed reservation to be committed")
	}
	if reservation.IsReleased() {
		t.Error("Expected committed reservation not to be released")
	}
	if !reservation.IsFinal() {
		t.Error("Expected committed reservation to be final")
	}

	// Test released status
	reservation.status = StatusReleased
	if reservation.IsPending() {
		t.Error("Expected released reservation not to be pending")
	}
	if reservation.IsCommitted() {
		t.Error("Expected released reservation not to be committed")
	}
	if !reservation.IsReleased() {
		t.Error("Expected released reservation to be released")
	}
	if !reservation.IsFinal() {
		t.Error("Expected released reservation to be final")
	}
}

func TestCommit(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)
	reservation := New(accountID, userID, amount)
	initialUpdatedAt := reservation.UpdatedAt()

	time.Sleep(time.Millisecond) // Ensure time difference

	actualAmount := account.HydrateAmount(800)
	err := reservation.Commit(actualAmount)

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if !reservation.Amount().Equals(actualAmount) {
		t.Errorf("Expected amount to be updated to %v, got %v", actualAmount, reservation.Amount())
	}

	if !reservation.Status().IsCommitted() {
		t.Errorf("Expected status to be committed, got %v", reservation.Status())
	}

	if !reservation.UpdatedAt().After(initialUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestCommitAlreadyFinalized(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)
	reservation := New(accountID, userID, amount)

	// Commit first time
	actualAmount := account.HydrateAmount(800)
	reservation.Commit(actualAmount)

	// Try to commit again
	err := reservation.Commit(account.HydrateAmount(600))
	if err == nil {
		t.Error("Expected error when trying to commit already finalized reservation")
	}
	if !IsAlreadyFinalizedError(err) {
		t.Errorf("Expected AlreadyFinalizedError, got %v", err)
	}
}

func TestRelease(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)
	reservation := New(accountID, userID, amount)
	initialUpdatedAt := reservation.UpdatedAt()

	time.Sleep(time.Millisecond) // Ensure time difference

	err := reservation.Release()

	if err != nil {
		t.Errorf("Expected no error, got %v", err)
	}

	if !reservation.Status().IsReleased() {
		t.Errorf("Expected status to be released, got %v", reservation.Status())
	}

	if !reservation.UpdatedAt().After(initialUpdatedAt) {
		t.Error("Expected UpdatedAt to be updated")
	}
}

func TestReleaseAlreadyFinalized(t *testing.T) {
	accountID := account.NewID()
	userID := "user123"
	amount := account.HydrateAmount(1000)
	reservation := New(accountID, userID, amount)

	// Release first time
	reservation.Release()

	// Try to release again
	err := reservation.Release()
	if err == nil {
		t.Error("Expected error when trying to release already finalized reservation")
	}
	if !IsAlreadyFinalizedError(err) {
		t.Errorf("Expected AlreadyFinalizedError, got %v", err)
	}
}