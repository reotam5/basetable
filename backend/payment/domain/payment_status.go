package domain

import (
	"strings"
)

type PaymentStatus struct {
	value string
}

var (
	PaymentStatusPending   = PaymentStatus{"pending"}
	PaymentStatusCompleted = PaymentStatus{"completed"}
	PaymentStatusFailed    = PaymentStatus{"failed"}
	PaymentStatusCancelled = PaymentStatus{"cancelled"}
)

func NewPaymentStatusFromString(status string) (PaymentStatus, error) {
	normalized := strings.ToLower(strings.TrimSpace(status))
	validStatuses := []PaymentStatus{
		PaymentStatusPending,
		PaymentStatusCompleted,
		PaymentStatusFailed,
		PaymentStatusCancelled,
	}

	for _, status := range validStatuses {
		if status.value == normalized {
			return status, nil
		}
	}
	return PaymentStatus{}, NewInvalidPaymentStatusError(status)
}

func (p PaymentStatus) String() string {
	return p.value
}

func (p PaymentStatus) IsFinal() bool {
	return p.IsCompleted() || p.IsFailed() || p.IsCancelled()
}

func (p PaymentStatus) IsPending() bool {
	return p.Equals(PaymentStatusPending)
}

func (p PaymentStatus) IsCompleted() bool {
	return p.Equals(PaymentStatusCompleted)
}

func (p PaymentStatus) IsFailed() bool {
	return p.Equals(PaymentStatusFailed)
}

func (p PaymentStatus) IsCancelled() bool {
	return p.Equals(PaymentStatusCancelled)
}

func (p PaymentStatus) Equals(other PaymentStatus) bool {
	return p.value == other.value
}
