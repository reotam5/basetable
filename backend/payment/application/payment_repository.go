package application

import (
	"context"

	"github.com/basetable/basetable/backend/payment/domain"
)

type PaymentRepository interface {
	Save(ctx context.Context, paymentSession *domain.Payment) error
	GetByID(ctx context.Context, id string) (*domain.Payment, error)
	GetByExternalID(ctx context.Context, externalID string) (*domain.Payment, error)
	GetByUserID(ctx context.Context, userID string) ([]*domain.Payment, error)
}
