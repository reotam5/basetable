package reservation

import "fmt"

type Error struct {
	Type    ErrorType
	Message string
}

type ErrorType string

const (
	ErrorTypeAlreadyFinalized ErrorType = "ALREADY_FINALIZED"
)

func (e *Error) Error() string {
	return e.Message
}

func (e *Error) ErrorType() ErrorType {
	return e.Type
}

func NewAlreadyFinalizedError(reservationID string, status string) *Error {
	return &Error{
		Type:    ErrorTypeAlreadyFinalized,
		Message: fmt.Sprintf("Reservation %s is already finalized with status %s", reservationID, status),
	}
}

func IsAlreadyFinalizedError(err error) bool {
	if reservationErr, ok := err.(*Error); ok {
		return reservationErr.Type == ErrorTypeAlreadyFinalized
	}
	return false
}
