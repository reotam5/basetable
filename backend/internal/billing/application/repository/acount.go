package repository

import (
	"context"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
)

type AccountRepository interface {
	Save(ctx context.Context, creditAccount *account.Account) error
	GetByID(ctx context.Context, id string) (*account.Account, error)
	GetByUserID(ctx context.Context, userID string) (*account.Account, error)

	// Read-for-update with locks
	GetByIDForUpdate(ctx context.Context, userID string) (*account.Account, error)
}
