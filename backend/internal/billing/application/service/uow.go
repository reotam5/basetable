package service

import (
	"context"

	"github.com/basetable/basetable/backend/internal/billing/application/repository"
)

type UnitOfWork interface {
	Do(ctx context.Context, fn func(ctx context.Context, tx repository.RepositoryProvider) error) error
}
