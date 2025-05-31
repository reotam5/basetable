package repository

import (
	"context"

	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
)

type LedgerRepository interface {
	Save(ctx context.Context, log *ledger.LedgerEntry) error
	GetByID(ctx context.Context, id string) (*ledger.LedgerEntry, error)
	GetByAccountID(ctx context.Context, creditAccountID string) ([]*ledger.LedgerEntry, error)
	GetBySourceID(ctx context.Context, sourceID string) (*ledger.LedgerEntry, error)
	GetByUserID(ctx context.Context, userID string) ([]*ledger.LedgerEntry, error)
}
