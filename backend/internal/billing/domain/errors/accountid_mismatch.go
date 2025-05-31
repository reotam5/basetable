package errors

import "fmt"

const (
	ErrorTypeAccountIDMismatch ErrorType = "ACCOUNT_ID_MISMATCH"
)

func NewAccountIDMismatchError(expected, actual string) error {
	return &Error{
		Type:    ErrorTypeAccountIDMismatch,
		Message: fmt.Sprintf("Account ID mismatch: expected %s, got %s", expected, actual),
	}
}
