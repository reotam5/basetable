package unitofwork

import (
	"context"

	"gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	grepo "github.com/basetable/basetable/backend/internal/billing/storage/gorm/repository"
)

type UnitOfWork struct {
	db *gorm.DB
}

func NewUnitOfWork(db *gorm.DB) *UnitOfWork {
	return &UnitOfWork{db: db}
}

func (uow *UnitOfWork) Do(ctx context.Context, fn func(ctx context.Context, prodiver repository.RepositoryProvider) error) error {
	return uow.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		provider := grepo.NewRepositoryProvider(tx)
		return fn(ctx, provider)
	})

}
