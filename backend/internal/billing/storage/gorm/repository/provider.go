package repository

import (
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"gorm.io/gorm"
)

type RepositoryProvider struct {
	tx *gorm.DB
}

func NewRepositoryProvider(tx *gorm.DB) *RepositoryProvider {
	return &RepositoryProvider{tx: tx}
}

func (p *RepositoryProvider) AccountRepository() repository.AccountRepository {
	return NewAccountRepository(p.tx)
}

func (p *RepositoryProvider) LedgerRepository() repository.LedgerRepository {
	return NewLedgerRepository(p.tx)
}

func (p *RepositoryProvider) ReservationRepository() repository.ReservationRepository {
	return NewReservationRepository(p.tx)
}
