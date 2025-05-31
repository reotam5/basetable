package model

import (
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
)

type LedgerEntryModel struct {
	ID        string    `gorm:"primaryKey;column:id"`
	AccountID string    `gorm:"column:account_id;index"`
	UserID    string    `gorm:"column:user_id"`
	EntryType string    `gorm:"column:entry_type"`
	Operation string    `gorm:"column:operation"`
	SourceID  string    `gorm:"column:source_id;index"`
	Amount    int64     `gorm:"column:amount"`
	CreatedAt time.Time `gorm:"column:created_at"`
}

func (m *LedgerEntryModel) TableName() string {
	return "credit_ledger_entries"
}

func (m *LedgerEntryModel) MapToDomain() *ledger.LedgerEntry {
	return ledger.HydrateEntry(
		m.ID,
		m.AccountID,
		m.UserID,
		m.EntryType,
		m.Operation,
		m.SourceID,
		m.Amount,
		map[string]any{},
		m.CreatedAt,
	)
}
