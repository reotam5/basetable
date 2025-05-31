package errors

type Error struct {
	Type    ErrorType
	Message string
}

type ErrorType string

func (e *Error) Error() string {
	return e.Message
}

func (e *Error) ErrorType() ErrorType {
	return e.Type
}
