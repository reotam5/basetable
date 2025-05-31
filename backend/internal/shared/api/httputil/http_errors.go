package httputil

import "net/http"

type HTTPError struct {
	Error   error
	Status  int
	Message string
}

type ErrorResponse struct {
	Title  string `json:"title"`
	Status int    `json:"status"`
	Detail string `json:"detail"`
}

func (e *HTTPError) Payload() *ErrorResponse {
	return &ErrorResponse{
		Title:  http.StatusText(e.Status),
		Status: e.Status,
		Detail: e.Message,
	}
}

func NewBadRequestError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusBadRequest,
		Message: err.Error(),
	}
}

func NewInternalError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusInternalServerError,
		Message: "Internal server error",
	}
}

func NewNotFoundError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusNotFound,
		Message: err.Error(),
	}
}

func NewUnauthorizedError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusUnauthorized,
		Message: err.Error(),
	}
}

func NewForbiddenError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusForbidden,
		Message: err.Error(),
	}
}

func NewConflictError(err error) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  http.StatusConflict,
		Message: err.Error(),
	}
}

func NewCustomError(err error, status int, message string) *HTTPError {
	return &HTTPError{
		Error:   err,
		Status:  status,
		Message: message,
	}
}
