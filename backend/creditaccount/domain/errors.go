package domain

import "fmt"

// CreditError represents errors related to credit operations
type CreditError struct {
	Type    CreditErrorType
	Message string
	Value   int64
}

type CreditErrorType string

const (
	CreditErrorTypeInvalidAmount     CreditErrorType = "INVALID_AMOUNT"
	CreditErrorTypeInsufficientFunds CreditErrorType = "INSUFFICIENT_FUNDS"
)

func (e *CreditError) Error() string {
	return e.Message
}

func (e *CreditError) ErrorType() CreditErrorType {
	return e.Type
}

func (e *CreditError) GetValue() int64 {
	return e.Value
}

// NewInvalidCreditAmountError creates an error for invalid credit amounts
func NewInvalidCreditAmountError(value int64) *CreditError {
	return &CreditError{
		Type:    CreditErrorTypeInvalidAmount,
		Message: fmt.Sprintf("invalid credit amount: %d, must be at least %d", value, MinCreditAmount),
		Value:   value,
	}
}

// NewInsufficientCreditsError creates an error for insufficient credit balance
func NewInsufficientCreditsError(available, requested int64) *CreditError {
	return &CreditError{
		Type:    CreditErrorTypeInsufficientFunds,
		Message: fmt.Sprintf("insufficient credits: available %d, requested %d", available, requested),
		Value:   available,
	}
}

// IsInvalidAmountError checks if the error is an invalid amount error
func IsInvalidAmountError(err error) bool {
	if creditErr, ok := err.(*CreditError); ok {
		return creditErr.Type == CreditErrorTypeInvalidAmount
	}
	return false
}

// IsInsufficientCreditsError checks if the error is an insufficient credits error
func IsInsufficientCreditsError(err error) bool {
	if creditErr, ok := err.(*CreditError); ok {
		return creditErr.Type == CreditErrorTypeInsufficientFunds
	}
	return false
}
