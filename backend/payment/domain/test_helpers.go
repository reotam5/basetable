package domain

import (
	"testing"
	"time"
)

// TestHelpers provides common assertion and creation utilities for domain tests
type TestHelpers struct {
	t *testing.T
}

// NewTestHelpers creates a new instance of test helpers
func NewTestHelpers(t *testing.T) *TestHelpers {
	return &TestHelpers{t: t}
}

// Payment Builder Pattern
type PaymentBuilder struct {
	id          *PaymentID
	userID      string
	amount      Amount
	status      PaymentStatus
	externalID  string
	externalURL string
	createdAt   time.Time
	updatedAt   time.Time
}

// NewPaymentBuilder creates a new payment builder with sensible defaults
func NewPaymentBuilder() *PaymentBuilder {
	amount := MustCreateAmount(15000, CurrencyUSD)
	return &PaymentBuilder{
		userID:    "test_user_123",
		amount:    amount,
		status:    PaymentStatusPending,
		createdAt: time.Now().Add(-time.Hour),
		updatedAt: time.Now().Add(-time.Minute),
	}
}

func (pb *PaymentBuilder) WithID(id PaymentID) *PaymentBuilder {
	pb.id = &id
	return pb
}

func (pb *PaymentBuilder) WithUserID(userID string) *PaymentBuilder {
	pb.userID = userID
	return pb
}

func (pb *PaymentBuilder) WithAmount(amount Amount) *PaymentBuilder {
	pb.amount = amount
	return pb
}

func (pb *PaymentBuilder) WithAmountValue(value int64) *PaymentBuilder {
	pb.amount = MustCreateAmount(value, CurrencyUSD)
	return pb
}

func (pb *PaymentBuilder) WithStatus(status PaymentStatus) *PaymentBuilder {
	pb.status = status
	return pb
}

func (pb *PaymentBuilder) WithExternalID(externalID string) *PaymentBuilder {
	pb.externalID = externalID
	return pb
}

func (pb *PaymentBuilder) WithExternalURL(externalURL string) *PaymentBuilder {
	pb.externalURL = externalURL
	return pb
}

func (pb *PaymentBuilder) WithCreatedAt(createdAt time.Time) *PaymentBuilder {
	pb.createdAt = createdAt
	return pb
}

func (pb *PaymentBuilder) WithUpdatedAt(updatedAt time.Time) *PaymentBuilder {
	pb.updatedAt = updatedAt
	return pb
}

func (pb *PaymentBuilder) AsPending() *PaymentBuilder {
	return pb.WithStatus(PaymentStatusPending)
}

func (pb *PaymentBuilder) AsCompleted() *PaymentBuilder {
	return pb.WithStatus(PaymentStatusCompleted)
}

func (pb *PaymentBuilder) AsFailed() *PaymentBuilder {
	return pb.WithStatus(PaymentStatusFailed)
}

func (pb *PaymentBuilder) AsCancelled() *PaymentBuilder {
	return pb.WithStatus(PaymentStatusCancelled)
}

func (pb *PaymentBuilder) Build() *Payment {
	if pb.status.Equals(PaymentStatusPending) && pb.id == nil {
		// For pending payments, use NewPayment to get proper initialization
		payment := NewPayment(pb.userID, pb.amount)
		if pb.externalID != "" || pb.externalURL != "" {
			_ = payment.AttachExternalReference(pb.externalID, pb.externalURL)
		}
		return payment
	}

	// For other statuses or when ID is specified, use RehydratePayment
	id := pb.id
	if id == nil {
		newID := NewPaymentID()
		id = &newID
	}

	return RehydratePayment(
		id.String(),
		pb.userID,
		pb.amount.Value(),
		pb.amount.Currency().String(),
		pb.status.String(),
		pb.externalID,
		pb.externalURL,
		pb.createdAt,
		pb.updatedAt,
	)
}

// Amount Builder Pattern
type AmountBuilder struct {
	value    int64
	currency Currency
}

func NewAmountBuilder() *AmountBuilder {
	return &AmountBuilder{
		value:    15000, // $150.00
		currency: CurrencyUSD,
	}
}

func (ab *AmountBuilder) WithValue(value int64) *AmountBuilder {
	ab.value = value
	return ab
}

func (ab *AmountBuilder) WithCurrency(currency Currency) *AmountBuilder {
	ab.currency = currency
	return ab
}

func (ab *AmountBuilder) WithDollars(dollars float64) *AmountBuilder {
	ab.value = int64(dollars * 100)
	return ab
}

func (ab *AmountBuilder) AsMinimum() *AmountBuilder {
	return ab.WithValue(MinValue)
}

func (ab *AmountBuilder) AsMaximum() *AmountBuilder {
	return ab.WithValue(MaxValue)
}

func (ab *AmountBuilder) Build() (Amount, error) {
	return NewAmount(ab.value, ab.currency)
}

func (ab *AmountBuilder) MustBuild() Amount {
	amount, err := ab.Build()
	if err != nil {
		panic(err)
	}
	return amount
}

// Utility Functions
func MustCreateAmount(value int64, currency Currency) Amount {
	amount, err := NewAmount(value, currency)
	if err != nil {
		panic(err)
	}
	return amount
}

func MustCreatePaymentStatus(status string) PaymentStatus {
	paymentStatus, err := NewPaymentStatusFromString(status)
	if err != nil {
		panic(err)
	}
	return paymentStatus
}

func MustCreateCurrency(currency string) Currency {
	curr, err := NewCurrencyFromString(currency)
	if err != nil {
		panic(err)
	}
	return curr
}

// Error Assertion Helpers
func (th *TestHelpers) AssertNoError(err error, msgAndArgs ...any) {
	if err != nil {
		th.t.Helper()
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected no error but got: %v. %v", err, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected no error but got: %v", err)
		}
	}
}

func (th *TestHelpers) AssertError(err error, msgAndArgs ...any) {
	if err == nil {
		th.t.Helper()
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected error but got none. %v", msgAndArgs[0])
		} else {
			th.t.Errorf("Expected error but got none")
		}
	}
}

func (th *TestHelpers) AssertPaymentError(err error, expectedType PaymentErrorType, msgAndArgs ...any) {
	th.t.Helper()
	th.AssertError(err, msgAndArgs...)

	paymentErr, ok := err.(*PaymentError)
	if !ok {
		th.t.Errorf("Expected PaymentError but got %T", err)
		return
	}

	if paymentErr.Type != expectedType {
		th.t.Errorf("Expected PaymentError type %v but got %v", expectedType, paymentErr.Type)
	}
}

func (th *TestHelpers) AssertInvalidStatusError(err error, msgAndArgs ...any) {
	th.AssertPaymentError(err, PaymentErrorTypeInvalidStatus, msgAndArgs...)
}

func (th *TestHelpers) AssertInvalidAmountError(err error, msgAndArgs ...any) {
	th.AssertPaymentError(err, PaymentErrorTypeInvalidAmountValue, msgAndArgs...)
}

func (th *TestHelpers) AssertInvalidCurrencyError(err error, msgAndArgs ...any) {
	th.AssertPaymentError(err, PaymentErrorTypeInvalidCurrency, msgAndArgs...)
}

func (th *TestHelpers) AssertSessionFinalizedError(err error, msgAndArgs ...any) {
	th.AssertPaymentError(err, PaymentErrorTypeSessionAlreadyFinalized, msgAndArgs...)
}

// Status Assertion Helpers
func (th *TestHelpers) AssertPaymentStatus(payment *Payment, expectedStatus PaymentStatus, msgAndArgs ...any) {
	th.t.Helper()
	if !payment.PaymentStatus().Equals(expectedStatus) {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected payment status %v but got %v. %v", expectedStatus, payment.PaymentStatus(), msgAndArgs[0])
		} else {
			th.t.Errorf("Expected payment status %v but got %v", expectedStatus, payment.PaymentStatus())
		}
	}
}

func (th *TestHelpers) AssertPaymentPending(payment *Payment, msgAndArgs ...any) {
	th.AssertPaymentStatus(payment, PaymentStatusPending, msgAndArgs...)
}

func (th *TestHelpers) AssertPaymentCompleted(payment *Payment, msgAndArgs ...any) {
	th.AssertPaymentStatus(payment, PaymentStatusCompleted, msgAndArgs...)
}

func (th *TestHelpers) AssertPaymentFailed(payment *Payment, msgAndArgs ...any) {
	th.AssertPaymentStatus(payment, PaymentStatusFailed, msgAndArgs...)
}

func (th *TestHelpers) AssertPaymentCancelled(payment *Payment, msgAndArgs ...any) {
	th.AssertPaymentStatus(payment, PaymentStatusCancelled, msgAndArgs...)
}

// General Assertion Helpers
func (th *TestHelpers) AssertEqual(actual, expected any, msgAndArgs ...any) {
	th.t.Helper()

	// Handle type conversions for common numeric comparisons
	if _, ok := actual.(int64); ok {
		if expectedInt, ok := expected.(int); ok {
			expected = int64(expectedInt)
		}
	}
	if actualInt, ok := actual.(int); ok {
		if _, ok := expected.(int64); ok {
			actual = int64(actualInt)
		}
	}

	if actual != expected {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected %v but got %v. %v", expected, actual, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected %v but got %v", expected, actual)
		}
	}
}

func (th *TestHelpers) AssertTrue(condition bool, msgAndArgs ...any) {
	th.t.Helper()
	if !condition {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected condition to be true. %v", msgAndArgs[0])
		} else {
			th.t.Errorf("Expected condition to be true")
		}
	}
}

func (th *TestHelpers) AssertFalse(condition bool, msgAndArgs ...any) {
	th.t.Helper()
	if condition {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected condition to be false. %v", msgAndArgs[0])
		} else {
			th.t.Errorf("Expected condition to be false")
		}
	}
}

func (th *TestHelpers) AssertTimeBefore(t1, t2 time.Time, msgAndArgs ...any) {
	th.t.Helper()
	if !t1.Before(t2) {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected %v to be before %v. %v", t1, t2, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected %v to be before %v", t1, t2)
		}
	}
}

func (th *TestHelpers) AssertTimeAfter(t1, t2 time.Time, msgAndArgs ...any) {
	th.t.Helper()
	if !t1.After(t2) {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected %v to be after %v. %v", t1, t2, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected %v to be after %v", t1, t2)
		}
	}
}

func (th *TestHelpers) AssertStringContains(s, substr string, msgAndArgs ...any) {
	th.t.Helper()
	if !containsSubstring(s, substr) {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected string to contain %q, got %q. %v", substr, s, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected string to contain %q, got %q", substr, s)
		}
	}
}

// Amount Assertion Helpers
func (th *TestHelpers) AssertAmountEquals(actual, expected Amount, msgAndArgs ...any) {
	th.t.Helper()
	if !actual.Equals(expected) {
		if len(msgAndArgs) > 0 {
			th.t.Errorf("Expected amount %v but got %v. %v", expected, actual, msgAndArgs[0])
		} else {
			th.t.Errorf("Expected amount %v but got %v", expected, actual)
		}
	}
}

// Test Data Factories
type TestData struct{}

var CommonTestData = TestData{}

func (td TestData) ValidAmounts() []Amount {
	return []Amount{
		MustCreateAmount(MinValue, CurrencyUSD),
		MustCreateAmount(15000, CurrencyUSD),
		MustCreateAmount(25000, CurrencyUSD),
		MustCreateAmount(MaxValue, CurrencyUSD),
	}
}

func (td TestData) InvalidAmountValues() []int64 {
	return []int64{
		MinValue - 1,
		0,
		-1000,
		MaxValue + 1,
		-MinValue,
	}
}

func (td TestData) AllPaymentStatuses() []PaymentStatus {
	return []PaymentStatus{
		PaymentStatusPending,
		PaymentStatusCompleted,
		PaymentStatusFailed,
		PaymentStatusCancelled,
	}
}

func (td TestData) FinalPaymentStatuses() []PaymentStatus {
	return []PaymentStatus{
		PaymentStatusCompleted,
		PaymentStatusFailed,
		PaymentStatusCancelled,
	}
}

func (td TestData) ValidCurrencyStrings() []string {
	return []string{"USD", "usd", "  USD  "}
}

func (td TestData) InvalidCurrencyStrings() []string {
	return []string{"EUR", "GBP", "", "   ", "XYZ", "INVALID"}
}

func (td TestData) ValidStatusStrings() []string {
	return []string{"pending", "completed", "failed", "cancelled", "PENDING", "Completed"}
}

func (td TestData) InvalidStatusStrings() []string {
	return []string{"processing", "unknown", "", "   ", "INVALID"}
}

// Helper function used by test helpers
func containsSubstring(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		if s[i:i+len(substr)] == substr {
			return true
		}
	}
	return false
}
