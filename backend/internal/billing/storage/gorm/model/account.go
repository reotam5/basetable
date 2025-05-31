package model

import (
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
)

type AccountModel struct {
	ID        string    `gorm:"primaryKey;column:id"`
	UserID    string    `gorm:"column:user_id"`
	Balance   int64     `gorm:"column:balance"`
	CreatedAt time.Time `gorm:"column:created_at"`
	UpdatedAt time.Time `gorm:"column:updated_at"`
}

func (m *AccountModel) TableName() string {
	return "credit_accounts"
}

func (m *AccountModel) MapToDomain() *account.Account {
	return account.Hydrate(
		m.ID,
		m.UserID,
		m.Balance,
		m.CreatedAt,
		m.UpdatedAt,
	)
}
