package errors

import (
	"fmt"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

const (
	ErrorTypeAccountIDMismatch domain.ErrorType = "ACCOUNT_ID_MISMATCH"
)

func NewAccountIDMismatchError(expected, actual string) error {
	return &domain.Error{
		Type:    ErrorTypeAccountIDMismatch,
		Message: fmt.Sprintf("Account ID mismatch: expected %s, got %s", expected, actual),
	}
}
