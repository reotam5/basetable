package repository

import (
	"context"

	"github.com/basetable/basetable/backend/internal/proxy/domain/provider"
)

type ProviderRepository interface {
	Save(ctx context.Context, provider *provider.Provider) error
	GetByID(ctx context.Context, id string) (*provider.Provider, error)
	GetByIDForUpdate(ctx context.Context, id string) (*provider.Provider, error)
	GetAll(ctx context.Context) ([]*provider.Provider, error)
	Delete(ctx context.Context, id string) error
}
