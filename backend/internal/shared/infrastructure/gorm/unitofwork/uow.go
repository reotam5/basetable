package unitofwork

import (
	"context"

	"gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/shared/application/unitofwork"
)

type UnitOfWork[T any] struct {
	db           *gorm.DB
	providerFunc func(*gorm.DB) T
}

func NewUnitOfWork[T any](db *gorm.DB, providerFunc func(*gorm.DB) T) unitofwork.UnitOfWork[T] {
	return &UnitOfWork[T]{
		db:           db,
		providerFunc: providerFunc,
	}
}

func (uow *UnitOfWork[T]) Do(ctx context.Context, fn func(ctx context.Context, provider T) error) error {
	return uow.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		provider := uow.providerFunc(tx)
		return fn(ctx, provider)
	})
}
