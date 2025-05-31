package application

import (
	"context"

	"github.com/basetable/basetable/backend/internal/payment/domain"
)

type CheckoutSession struct {
	SessionID  string
	SessionURL string
}

type InitiateCheckoutSessionRequest struct {
	PaymentID string
	UserID    string
	Amount    domain.Amount
}

type PaymentGateway interface {
	InitiateCheckoutSession(ctx context.Context, req InitiateCheckoutSessionRequest) (*CheckoutSession, error)
}
