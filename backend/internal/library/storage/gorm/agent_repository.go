package gorm

import (
	"context"

	"gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/library/application"
	"github.com/basetable/basetable/backend/internal/library/domain"
)

type AgentRepository struct {
	db *gorm.DB
}

var _ application.AgentRepository = (*AgentRepository)(nil)

func NewAgentRepository(db *gorm.DB) *AgentRepository {
	return &AgentRepository{db: db}
}

func (r *AgentRepository) Save(ctx context.Context, agent *domain.Agent) error {
	return r.db.WithContext(ctx).Save(MapDomainToModel(agent)).Error
}

func (r *AgentRepository) GetByID(ctx context.Context, id string) (*domain.Agent, error) {
	var agentModel AgentModel

	err := r.db.WithContext(ctx).
		Where("id = ?", id).
		First(&agentModel).Error

	if err != nil {
		return nil, err
	}

	return agentModel.MapToDomain()
}

func (r *AgentRepository) GetAll(ctx context.Context) ([]*domain.Agent, error) {
	var agentModels []AgentModel

	err := r.db.WithContext(ctx).
		Find(&agentModels).Error

	if err != nil {
		return nil, err
	}

	agents := make([]*domain.Agent, len(agentModels))
	for i, agentModel := range agentModels {
		domainAgent, err := agentModel.MapToDomain()
		if err != nil {
			return nil, err
		}
		agents[i] = domainAgent
	}

	return agents, nil
}

func (r *AgentRepository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).
		Where("id = ?", id).
		Delete(&AgentModel{}).Error
}
