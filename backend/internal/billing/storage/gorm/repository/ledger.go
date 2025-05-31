package repository

import (
	"context"

	"gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
	"github.com/basetable/basetable/backend/internal/billing/storage/gorm/model"
)

type LedgerRepository struct {
	db *gorm.DB
}

var _ repository.LedgerRepository = (*LedgerRepository)(nil)

func NewLedgerRepository(db *gorm.DB) *LedgerRepository {
	return &LedgerRepository{db: db}
}

func (r *LedgerRepository) Save(ctx context.Context, ledger *ledger.LedgerEntry) error {
	return r.db.WithContext(ctx).Save(r.MapDomainToModel(ledger)).Error
}

func (r *LedgerRepository) GetByID(ctx context.Context, id string) (*ledger.LedgerEntry, error) {
	entry := &model.LedgerEntryModel{}
	if err := r.db.WithContext(ctx).Where("id = ?", id).First(entry).Error; err != nil {
		return nil, err
	}
	return entry.MapToDomain(), nil
}

func (r *LedgerRepository) GetByAccountID(ctx context.Context, accountID string) ([]*ledger.LedgerEntry, error) {
	var entries []*model.LedgerEntryModel
	if err := r.db.WithContext(ctx).Where("account_id = ?", accountID).Find(&entries).Error; err != nil {
		return nil, err
	}

	domainEntries := make([]*ledger.LedgerEntry, 0, len(entries))
	for _, entry := range entries {
		domainEntries = append(domainEntries, entry.MapToDomain())
	}

	return domainEntries, nil
}

func (r *LedgerRepository) GetByUserID(ctx context.Context, userID string) ([]*ledger.LedgerEntry, error) {
	var entries []*model.LedgerEntryModel
	if err := r.db.WithContext(ctx).Where("user_id = ?", userID).Find(&entries).Error; err != nil {
		return nil, err
	}

	domainEntries := make([]*ledger.LedgerEntry, 0, len(entries))
	for _, entry := range entries {
		domainEntries = append(domainEntries, entry.MapToDomain())
	}

	return domainEntries, nil
}

func (r *LedgerRepository) GetBySourceID(ctx context.Context, sourceID string) (*ledger.LedgerEntry, error) {
	entry := &model.LedgerEntryModel{}
	if err := r.db.WithContext(ctx).Where("source_id = ?", sourceID).First(entry).Error; err != nil {
		return nil, err
	}
	return entry.MapToDomain(), nil
}

func (r *LedgerRepository) MapDomainToModel(entry *ledger.LedgerEntry) *model.LedgerEntryModel {
	return &model.LedgerEntryModel{
		ID:        entry.ID().String(),
		AccountID: entry.AccountID().String(),
		UserID:    entry.UserID(),
		EntryType: entry.Type().String(),
		Operation: entry.Operation().String(),
		SourceID:  entry.SourceID(),
		Amount:    entry.Amount().Value(),
		CreatedAt: entry.CreatedAt(),
	}
}
