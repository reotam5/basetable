package domain

import (
	"testing"
	"time"
)

func TestNewPaymentID(t *testing.T) {
	h := NewTestHelpers(t)

	id1 := NewID()
	id2 := NewID()

	h.AssertTrue(id1.String() != "", "PaymentID should not be empty")
	h.AssertTrue(id1.String() != id2.String(), "PaymentIDs should be unique")
}

func TestNewPayment(t *testing.T) {
	h := NewTestHelpers(t)
	userID := "user_123"
	amount := NewAmountBuilder().WithValue(15000).MustBuild()

	payment := NewPayment(userID, amount)

	h.AssertEqual(payment.UserID(), userID)
	h.AssertAmountEquals(payment.Amount(), amount)
	h.AssertPaymentPending(payment)
	h.AssertEqual(payment.ExternalID(), "")
	h.AssertEqual(payment.ExternalURL(), "")
	h.AssertTrue(payment.ID().String() != "", "Payment should have non-empty ID")
	h.AssertFalse(payment.CreatedAt().IsZero(), "CreatedAt should be set")
	h.AssertFalse(payment.UpdatedAt().IsZero(), "UpdatedAt should be set")
}

func TestRehydratePayment(t *testing.T) {
	h := NewTestHelpers(t)

	payment := NewPaymentBuilder().
		WithUserID("user_456").
		WithAmountValue(20000).
		AsCompleted().
		WithExternalID("stripe_session_789").
		WithExternalURL("https://checkout.stripe.com/session_789").
		Build()

	h.AssertEqual(payment.UserID(), "user_456")
	h.AssertEqual(payment.Amount().Value(), int64(20000))
	h.AssertPaymentCompleted(payment)
	h.AssertEqual(payment.ExternalID(), "stripe_session_789")
	h.AssertEqual(payment.ExternalURL(), "https://checkout.stripe.com/session_789")
}

func TestPaymentAttachExternalReference(t *testing.T) {
	tests := []struct {
		name       string
		status     PaymentStatus
		shouldFail bool
	}{
		{"pending_payment", PaymentStatusPending, false},
		{"completed_payment", PaymentStatusCompleted, true},
		{"failed_payment", PaymentStatusFailed, true},
		{"cancelled_payment", PaymentStatusCancelled, true},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTestHelpers(t)
			payment := NewPaymentBuilder().WithStatus(tt.status).Build()
			originalUpdatedAt := payment.UpdatedAt()

			time.Sleep(time.Millisecond) // Ensure time difference

			err := payment.AttachExternalReference("stripe_123", "https://checkout.stripe.com/123")

			if tt.shouldFail {
				h.AssertSessionFinalizedError(err)
				return
			}

			h.AssertNoError(err)
			h.AssertEqual(payment.ExternalID(), "stripe_123")
			h.AssertEqual(payment.ExternalURL(), "https://checkout.stripe.com/123")
			h.AssertTimeAfter(payment.UpdatedAt(), originalUpdatedAt, "UpdatedAt should be updated")
		})
	}
}

func TestPaymentStatusTransitions(t *testing.T) {
	tests := []struct {
		name           string
		initialStatus  PaymentStatus
		action         func(*Payment) error
		expectedStatus PaymentStatus
		shouldFail     bool
	}{
		{
			name:           "mark_pending_as_completed",
			initialStatus:  PaymentStatusPending,
			action:         (*Payment).MarkAsCompleted,
			expectedStatus: PaymentStatusCompleted,
			shouldFail:     false,
		},
		{
			name:           "mark_pending_as_failed",
			initialStatus:  PaymentStatusPending,
			action:         (*Payment).MarkAsFailed,
			expectedStatus: PaymentStatusFailed,
			shouldFail:     false,
		},
		{
			name:           "mark_pending_as_cancelled",
			initialStatus:  PaymentStatusPending,
			action:         (*Payment).MarkAsCancelled,
			expectedStatus: PaymentStatusCancelled,
			shouldFail:     false,
		},
		{
			name:          "mark_completed_as_failed_should_fail",
			initialStatus: PaymentStatusCompleted,
			action:        (*Payment).MarkAsFailed,
			shouldFail:    true,
		},
		{
			name:          "mark_failed_as_completed_should_fail",
			initialStatus: PaymentStatusFailed,
			action:        (*Payment).MarkAsCompleted,
			shouldFail:    true,
		},
		{
			name:          "mark_cancelled_as_completed_should_fail",
			initialStatus: PaymentStatusCancelled,
			action:        (*Payment).MarkAsCompleted,
			shouldFail:    true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			h := NewTestHelpers(t)
			payment := NewPaymentBuilder().WithStatus(tt.initialStatus).Build()
			originalUpdatedAt := payment.UpdatedAt()

			time.Sleep(time.Millisecond) // Ensure time difference

			err := tt.action(payment)

			if tt.shouldFail {
				h.AssertSessionFinalizedError(err)
				return
			}

			h.AssertNoError(err)
			h.AssertPaymentStatus(payment, tt.expectedStatus)
			h.AssertTimeAfter(payment.UpdatedAt(), originalUpdatedAt, "UpdatedAt should be updated")
		})
	}
}

func TestPaymentStatusCheckers(t *testing.T) {
	statusTests := []struct {
		status   PaymentStatus
		checkers map[string]bool
	}{
		{
			PaymentStatusPending,
			map[string]bool{
				"IsFinalized": false,
				"IsPending":   true,
				"IsCompleted": false,
				"IsFailed":    false,
				"IsCancelled": false,
			},
		},
		{
			PaymentStatusCompleted,
			map[string]bool{
				"IsFinalized": true,
				"IsPending":   false,
				"IsCompleted": true,
				"IsFailed":    false,
				"IsCancelled": false,
			},
		},
		{
			PaymentStatusFailed,
			map[string]bool{
				"IsFinalized": true,
				"IsPending":   false,
				"IsCompleted": false,
				"IsFailed":    true,
				"IsCancelled": false,
			},
		},
		{
			PaymentStatusCancelled,
			map[string]bool{
				"IsFinalized": true,
				"IsPending":   false,
				"IsCompleted": false,
				"IsFailed":    false,
				"IsCancelled": true,
			},
		},
	}

	for _, st := range statusTests {
		t.Run("status_"+st.status.String(), func(t *testing.T) {
			h := NewTestHelpers(t)
			payment := NewPaymentBuilder().WithStatus(st.status).Build()

			h.AssertEqual(payment.IsFinalized(), st.checkers["IsFinalized"])
			h.AssertEqual(payment.IsPending(), st.checkers["IsPending"])
			h.AssertEqual(payment.IsCompleted(), st.checkers["IsCompleted"])
			h.AssertEqual(payment.IsFailed(), st.checkers["IsFailed"])
			h.AssertEqual(payment.IsCancelled(), st.checkers["IsCancelled"])
		})
	}
}

func TestPaymentString(t *testing.T) {
	h := NewTestHelpers(t)

	payment := NewPaymentBuilder().
		WithID(HydrateID("payment_123")).
		WithUserID("user_456").
		WithAmountValue(15000).
		AsCompleted().
		WithExternalID("stripe_session_789").
		WithExternalURL("https://checkout.stripe.com/session_789").
		WithCreatedAt(time.Date(2023, 1, 1, 12, 0, 0, 0, time.UTC)).
		WithUpdatedAt(time.Date(2023, 1, 1, 12, 30, 0, 0, time.UTC)).
		Build()

	result := payment.String()

	expectedParts := []string{
		"PaymentSession(",
		"ID: payment_123",
		"UserID: user_456",
		"Amount: 150.00 USD",
		"Status: completed",
		"ExternalID: stripe_session_789",
		"ExternalURL: https://checkout.stripe.com/session_789",
		"CreatedAt: 2023-01-01T12:00:00Z",
		"UpdatedAt: 2023-01-01T12:30:00Z",
		")",
	}

	for _, part := range expectedParts {
		h.AssertStringContains(result, part)
	}
}

func TestPaymentCompleteWorkflow(t *testing.T) {
	h := NewTestHelpers(t)

	// Create a new payment
	payment := NewPaymentBuilder().AsPending().Build()
	h.AssertPaymentPending(payment)
	h.AssertFalse(payment.IsFinalized())

	// Attach external reference
	err := payment.AttachExternalReference("stripe_session_123", "https://checkout.stripe.com/session_123")
	h.AssertNoError(err)
	h.AssertEqual(payment.ExternalID(), "stripe_session_123")

	// Mark as completed
	err = payment.MarkAsCompleted()
	h.AssertNoError(err)
	h.AssertPaymentCompleted(payment)
	h.AssertTrue(payment.IsFinalized())

	// Try to change status again (should fail)
	err = payment.MarkAsFailed()
	h.AssertSessionFinalizedError(err)
}

func TestPaymentFailureWorkflow(t *testing.T) {
	h := NewTestHelpers(t)

	// Create payment and attach external reference
	payment := NewPaymentBuilder().AsPending().Build()
	err := payment.AttachExternalReference("stripe_123", "https://checkout.stripe.com/123")
	h.AssertNoError(err)

	// Mark as failed
	err = payment.MarkAsFailed()
	h.AssertNoError(err)
	h.AssertPaymentFailed(payment)
	h.AssertTrue(payment.IsFinalized())

	// Try to complete failed payment (should fail)
	err = payment.MarkAsCompleted()
	h.AssertSessionFinalizedError(err)
}

func TestPaymentCancellationWorkflow(t *testing.T) {
	h := NewTestHelpers(t)

	// Create and cancel payment
	payment := NewPaymentBuilder().AsPending().Build()
	err := payment.MarkAsCancelled()
	h.AssertNoError(err)
	h.AssertPaymentCancelled(payment)
	h.AssertTrue(payment.IsFinalized())

	// Try to attach external reference to cancelled payment (should fail)
	err = payment.AttachExternalReference("stripe_123", "https://checkout.stripe.com/123")
	h.AssertSessionFinalizedError(err)
}

func TestPaymentBuilder(t *testing.T) {
	h := NewTestHelpers(t)

	// Test builder with defaults
	payment := NewPaymentBuilder().Build()
	h.AssertEqual(payment.UserID(), "test_user_123")
	h.AssertEqual(payment.Amount().Value(), int64(15000))
	h.AssertPaymentPending(payment)

	// Test builder with custom values
	customAmount := NewAmountBuilder().WithValue(25000).MustBuild()
	payment = NewPaymentBuilder().
		WithUserID("custom_user").
		WithAmount(customAmount).
		AsCompleted().
		WithExternalID("external_123").
		WithExternalURL("https://example.com").
		Build()

	h.AssertEqual(payment.UserID(), "custom_user")
	h.AssertAmountEquals(payment.Amount(), customAmount)
	h.AssertPaymentCompleted(payment)
	h.AssertEqual(payment.ExternalID(), "external_123")
	h.AssertEqual(payment.ExternalURL(), "https://example.com")

	// Test convenience methods
	pendingPayment := NewPaymentBuilder().AsPending().Build()
	h.AssertPaymentPending(pendingPayment)

	completedPayment := NewPaymentBuilder().AsCompleted().Build()
	h.AssertPaymentCompleted(completedPayment)

	failedPayment := NewPaymentBuilder().AsFailed().Build()
	h.AssertPaymentFailed(failedPayment)

	cancelledPayment := NewPaymentBuilder().AsCancelled().Build()
	h.AssertPaymentCancelled(cancelledPayment)
}
