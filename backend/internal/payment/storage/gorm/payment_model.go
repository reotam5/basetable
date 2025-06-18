package gorm

import (
	"time"

	"github.com/basetable/basetable/backend/internal/payment/domain"
)

type PaymentModel struct {
	ID          string    `gorm:"primaryKey;column:id"`
	AccountID   string    `gorm:"column:account_id"`
	Amount      int64     `gorm:"column:amount"`
	Currency    string    `gorm:"column:currency"`
	Status      string    `gorm:"column:status"`
	ExternalID  string    `gorm:"column:external_id"`
	ExternalURL string    `gorm:"column:external_url"`
	CreatedAt   time.Time `gorm:"column:created_at"`
	UpdatedAt   time.Time `gorm:"column:updated_at"`
}

func (m *PaymentModel) TableName() string {
	return "payments"
}

func (m *PaymentModel) mapToDomain() *domain.Payment {
	return domain.RehydratePayment(
		m.ID,
		m.AccountID,
		m.Amount,
		m.Currency,
		m.Status,
		m.ExternalID,
		m.ExternalURL,
		m.CreatedAt,
		m.UpdatedAt,
	)
}

func mapFromDomain(p *domain.Payment) *PaymentModel {
	return &PaymentModel{
		ID:          p.ID().String(),
		AccountID:   p.AccountID(),
		Amount:      p.Amount().Value(),
		Currency:    p.Amount().Currency().String(),
		Status:      p.PaymentStatus().String(),
		ExternalID:  p.ExternalID(),
		ExternalURL: p.ExternalURL(),
		CreatedAt:   p.CreatedAt(),
		UpdatedAt:   p.UpdatedAt(),
	}
}
