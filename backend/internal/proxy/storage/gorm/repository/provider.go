package repository

import (
	"context"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/basetable/basetable/backend/internal/proxy/application/repository"
	"github.com/basetable/basetable/backend/internal/proxy/domain/provider"
	"github.com/basetable/basetable/backend/internal/proxy/storage/gorm/model"
)

type ProviderRepository struct {
	db *gorm.DB
}

var _ repository.ProviderRepository = (*ProviderRepository)(nil)

func NewProviderRepository(db *gorm.DB) *ProviderRepository {
	return &ProviderRepository{db: db}
}

func (r *ProviderRepository) Save(ctx context.Context, p *provider.Provider) error {
	providerModel := model.MapDomainToModel(p)

	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Save the provider
		if err := tx.Save(providerModel).Error; err != nil {
			return err
		}

		// Delete existing related records to avoid duplicates
		if err := tx.Where("provider_id = ?", providerModel.ID).Delete(&model.ModelModel{}).Error; err != nil {
			return err
		}
		if err := tx.Where("provider_id = ?", providerModel.ID).Delete(&model.EndpointModel{}).Error; err != nil {
			return err
		}

		// Create new related records
		if len(providerModel.Models) > 0 {
			if err := tx.Create(&providerModel.Models).Error; err != nil {
				return err
			}
		}
		if len(providerModel.Endpoints) > 0 {
			if err := tx.Create(&providerModel.Endpoints).Error; err != nil {
				return err
			}
		}

		return nil
	})
}

func (r *ProviderRepository) GetByID(ctx context.Context, id string) (*provider.Provider, error) {
	var providerModel model.ProviderModel

	err := r.db.WithContext(ctx).
		Preload("Models").
		Preload("Endpoints").
		Where("id = ?", id).
		First(&providerModel).Error

	if err != nil {
		return nil, err
	}

	return providerModel.MapToDomain()
}

func (r *ProviderRepository) GetByIDForUpdate(ctx context.Context, id string) (*provider.Provider, error) {
	var providerModel model.ProviderModel

	err := r.db.WithContext(ctx).
		Clauses(clause.Locking{Strength: "UPDATE"}).
		Preload("Models").
		Preload("Endpoints").
		Where("id = ?", id).
		First(&providerModel).Error

	if err != nil {
		return nil, err
	}

	return providerModel.MapToDomain()
}

func (r *ProviderRepository) GetAll(ctx context.Context) ([]*provider.Provider, error) {
	var providerModels []model.ProviderModel

	err := r.db.WithContext(ctx).
		Preload("Models").
		Preload("Endpoints").
		Find(&providerModels).Error

	if err != nil {
		return nil, err
	}

	providers := make([]*provider.Provider, len(providerModels))
	for i, providerModel := range providerModels {
		domainProvider, err := providerModel.MapToDomain()
		if err != nil {
			return nil, err
		}
		providers[i] = domainProvider
	}

	return providers, nil
}

func (r *ProviderRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// Delete related models and endpoints first (should cascade but being explicit)
		if err := tx.Where("provider_id = ?", id).Delete(&model.ModelModel{}).Error; err != nil {
			return err
		}
		if err := tx.Where("provider_id = ?", id).Delete(&model.EndpointModel{}).Error; err != nil {
			return err
		}

		// Delete the provider
		return tx.Where("id = ?", id).Delete(&model.ProviderModel{}).Error
	})
}
