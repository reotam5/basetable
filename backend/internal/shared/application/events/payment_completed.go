package events

import (
	eb "github.com/basetable/basetable/backend/internal/shared/application/eventbus"
)

type PaymentCompletedPayload struct {
	PaymentID string
	UserID    string
	Amount    int64
}

var (
	PaymentCompletedEvent eb.EventType = "payment_completed"
)
