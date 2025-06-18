package domain

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

func IsErrorType(err error, errType ErrorType) bool {
	if e, ok := err.(*Error); ok {
		return e.Type == errType
	}
	return false
}
