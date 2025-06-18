package repository

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/billing/storage/gorm/model"
)

type AccountRepository struct {
	db *gorm.DB
}

var _ repository.AccountRepository = (*AccountRepository)(nil)

func NewAccountRepository(db *gorm.DB) *AccountRepository {
	return &AccountRepository{db: db}
}

func (r *AccountRepository) Save(ctx context.Context, acc *account.Account) error {
	return r.db.WithContext(ctx).Save(r.MapDomainToModel(acc)).Error
}

func (r *AccountRepository) GetByID(ctx context.Context, id string) (*account.Account, error) {
	acc := &model.AccountModel{}
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(acc).Error; err != nil {
		return nil, err
	}
	return acc.MapToDomain(), nil
}

func (r *AccountRepository) GetByUserID(ctx context.Context, userID string) (*account.Account, error) {
	acc := &model.AccountModel{}
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).First(acc).Error; err != nil {
		return nil, err
	}
	return acc.MapToDomain(), nil
}

func (r *AccountRepository) GetByIDForUpdate(ctx context.Context, id string) (*account.Account, error) {
	acc := &model.AccountModel{}
	if err := r.db.WithContext(ctx).Clauses(clause.Locking{Strength: "UPDATE"}).Where("id = ?", id).First(acc).Error; err != nil {
		return nil, err
	}
	return acc.MapToDomain(), nil
}

func (r *AccountRepository) MapDomainToModel(ca *account.Account) *model.AccountModel {
	return &model.AccountModel{
		ID:        ca.ID().String(),
		UserID:    ca.UserID(),
		Balance:   ca.Balance().Value(),
		CreatedAt: ca.CreatedAt(),
		UpdatedAt: ca.UpdatedAt(),
	}
}
