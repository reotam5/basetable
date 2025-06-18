package repository

import (
	"github.com/basetable/basetable/backend/internal/proxy/application/repository"
	"gorm.io/gorm"
)

type RepositoryProvider struct {
	tx *gorm.DB
}

func NewRepositoryProvider(tx *gorm.DB) repository.RepositoryProvider {
	return &RepositoryProvider{tx: tx}
}

func (p *RepositoryProvider) ProviderRepository() repository.ProviderRepository {
	return NewProviderRepository(p.tx)
}