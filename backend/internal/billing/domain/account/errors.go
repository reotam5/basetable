package account

import (
	"fmt"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

const (
	ErrorTypeInvalidAmount      domain.ErrorType = "INVALID_AMOUNT"
	ErrorTypeInsufficientAmount domain.ErrorType = "INSUFFICIENT_AMOUNT"
	ErrorTypeOverflow           domain.ErrorType = "OVERFLOW"
)

func NewInvalidAmountError(value int64) *domain.Error {
	return &domain.Error{
		Type:    ErrorTypeInvalidAmount,
		Message: fmt.Sprintf("invalid credit amount: %d, must be at least %d", value, MinAmount),
	}
}

func NewInsufficientAmountError(available, requested int64) *domain.Error {
	return &domain.Error{
		Type:    ErrorTypeInsufficientAmount,
		Message: fmt.Sprintf("insufficient amount: available %d, requested %d", available, requested),
	}
}

func NewOverflowError(available, requested int64) *domain.Error {
	return &domain.Error{
		Type:    ErrorTypeOverflow,
		Message: fmt.Sprintf("amount overflow: %d + %d exceeds maximum value", available, requested),
	}
}
