package account

import (
	"fmt"

	"github.com/basetable/basetable/backend/internal/billing/domain/errors"
)

const (
	ErrorTypeInvalidAmount      errors.ErrorType = "INVALID_AMOUNT"
	ErrorTypeInsufficientAmount errors.ErrorType = "INSUFFICIENT_AMOUNT"
	ErrorTypeOverflow           errors.ErrorType = "OVERFLOW"
)

func NewInvalidAmountError(value int64) *errors.Error {
	return &errors.Error{
		Type:    ErrorTypeInvalidAmount,
		Message: fmt.Sprintf("invalid credit amount: %d, must be at least %d", value, MinAmount),
	}
}

func NewInsufficientAmountError(available, requested int64) *errors.Error {
	return &errors.Error{
		Type:    ErrorTypeInsufficientAmount,
		Message: fmt.Sprintf("insufficient amount: available %d, requested %d", available, requested),
	}
}

func NewOverflowError(available, requested int64) *errors.Error {
	return &errors.Error{
		Type:    ErrorTypeOverflow,
		Message: fmt.Sprintf("amount overflow: %d + %d exceeds maximum value", available, requested),
	}
}

func IsInvalidAmountError(err error) bool {
	if creditErr, ok := err.(*errors.Error); ok {
		return creditErr.Type == ErrorTypeInvalidAmount
	}
	return false
}

func IsInsufficientAmountError(err error) bool {
	if creditErr, ok := err.(*errors.Error); ok {
		return creditErr.Type == ErrorTypeInsufficientAmount
	}
	return false
}

func IsOverflowError(err error) bool {
	if creditErr, ok := err.(*errors.Error); ok {
		return creditErr.Type == ErrorTypeOverflow
	}
	return false
}
