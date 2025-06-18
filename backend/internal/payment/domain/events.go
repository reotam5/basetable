package domain

import "github.com/basetable/basetable/backend/internal/shared/domain"

type PaymentEventPayload struct {
	PaymentID string
	AccountID string
	Amount    int64
}

var (
	PaymentCompletedEvent domain.EventType = "payment_completed"
	PaymentFailedEvent    domain.EventType = "payment_failed"
	PaymentCancelledEvent domain.EventType = "payment_cancelled"
)
