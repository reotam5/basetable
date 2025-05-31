package gorm

import (
	"context"

	"gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/payment/domain"
)

type PaymentRepository struct {
	db *gorm.DB
}

func NewPaymentRepository(db *gorm.DB) *PaymentRepository {
	return &PaymentRepository{db: db}
}

func (r *PaymentRepository) Save(ctx context.Context, payment *domain.Payment) error {
	return r.db.WithContext(ctx).Save(mapFromDomain(payment)).Error
}

func (r *PaymentRepository) GetByID(ctx context.Context, id string) (*domain.Payment, error) {
	payment := &PaymentModel{}
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(payment).Error; err != nil {
		return nil, err
	}
	return payment.mapToDomain(), nil
}
func (r *PaymentRepository) GetByExternalID(ctx context.Context, externalID string) (*domain.Payment, error) {
	payment := &PaymentModel{}
	if err := r.db.WithContext(ctx).Where("external_id = ?", externalID).First(payment).Error; err != nil {
		return nil, err
	}
	return payment.mapToDomain(), nil
}

func (r *PaymentRepository) GetByUserID(ctx context.Context, userID string) ([]*domain.Payment, error) {
	var payments []*PaymentModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&payments).Error; err != nil {
		return nil, err
	}

	domainPayments := make([]*domain.Payment, 0, len(payments))
	for _, payment := range payments {
		domainPayments = append(domainPayments, payment.mapToDomain())
	}

	return domainPayments, nil
}
