package model

import (
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
)

type ReservationModel struct {
	ID        string    `gorm:"primaryKey;column:id"`
	AccountID string    `gorm:"column:account_id;index"`
	UserID    string    `gorm:"column:user_id"`
	Amount    int64     `gorm:"column:amount"`
	Status    string    `gorm:"column:status"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (m *ReservationModel) TableName() string {
	return "credit_reservations"
}

func (m *ReservationModel) MapToDomain() *reservation.Reservation {
	return reservation.Hydrate(
		m.ID,
		m.AccountID,
		m.UserID,
		m.Amount,
		m.Status,
		m.CreatedAt,
		m.UpdatedAt,
	)
}
