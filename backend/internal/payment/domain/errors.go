package domain

import "fmt"

// PaymentError represents errors related to payment operations
type PaymentError struct {
	Type    PaymentErrorType
	Message string
	Context map[string]any
}

type PaymentErrorType string

const (
	PaymentErrorTypeInvalidStatus           PaymentErrorType = "INVALID_STATUS"
	PaymentErrorTypeSessionAlreadyFinalized PaymentErrorType = "SESSION_ALREADY_FINALIZED"
	PaymentErrorTypeInvalidAmountValue      PaymentErrorType = "INVALID_AMOUNT_VALUE"
	PaymentErrorTypeInvalidCurrency         PaymentErrorType = "INVALID_CURRENCY"
)

func (e *PaymentError) Error() string {
	return e.Message
}

func (e *PaymentError) ErrorType() PaymentErrorType {
	return e.Type
}

func (e *PaymentError) GetContext() map[string]any {
	return e.Context
}

// NewInvalidPaymentStatusError creates an error for invalid payment status
func NewInvalidPaymentStatusError(status string) *PaymentError {
	return &PaymentError{
		Type:    PaymentErrorTypeInvalidStatus,
		Message: fmt.Sprintf("invalid payment status: %s", status),
		Context: map[string]any{
			"status": status,
		},
	}
}

// NewPaymentAlreadyFinalizedError creates an error for already finalized sessions
func NewPaymentAlreadyFinalizedError(sessionID string, currentStatus PaymentStatus) *PaymentError {
	return &PaymentError{
		Type:    PaymentErrorTypeSessionAlreadyFinalized,
		Message: fmt.Sprintf("payment session %s is already finalized with status: %s", sessionID, currentStatus.String()),
		Context: map[string]any{
			"session_id":     sessionID,
			"current_status": currentStatus.String(),
		},
	}
}

// NewInvalidAmountValueError creates an error for invalid top-up amounts
func NewInvalidAmountValueError(amount int64) *PaymentError {
	return &PaymentError{
		Type:    PaymentErrorTypeInvalidAmountValue,
		Message: fmt.Sprintf("invalid amount value: %d, must be between %d and %d", amount, MinValue, MaxValue),
		Context: map[string]any{
			"amount": amount,
		},
	}
}

// NewInvalidCurrencyError creates an error for invalid currencies
func NewInvalidCurrencyError(currency string) *PaymentError {
	return &PaymentError{
		Type:    PaymentErrorTypeInvalidCurrency,
		Message: fmt.Sprintf("invalid currency: %s", currency),
		Context: map[string]any{
			"currency": currency,
		},
	}
}

// IsInvalidStatusError checks if the error is an invalid status error
func IsInvalidStatusError(err error) bool {
	if paymentErr, ok := err.(*PaymentError); ok {
		return paymentErr.Type == PaymentErrorTypeInvalidStatus
	}
	return false
}

// IsSessionAlreadyFinalizedError checks if the error is a session already finalized error
func IsSessionAlreadyFinalizedError(err error) bool {
	if paymentErr, ok := err.(*PaymentError); ok {
		return paymentErr.Type == PaymentErrorTypeSessionAlreadyFinalized
	}
	return false
}

// IsInvalidAmountValueError checks if the error is an invalid top-up amount error
func IsInvalidAmountValueError(err error) bool {
	if paymentErr, ok := err.(*PaymentError); ok {
		return paymentErr.Type == PaymentErrorTypeInvalidAmountValue
	}
	return false
}

// IsInvalidCurrencyError checks if the error is an invalid currency error
func IsInvalidCurrencyError(err error) bool {
	if paymentErr, ok := err.(*PaymentError); ok {
		return paymentErr.Type == PaymentErrorTypeInvalidCurrency
	}
	return false
}
