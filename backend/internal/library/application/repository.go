package application

import (
	"context"

	"github.com/basetable/basetable/backend/internal/library/domain"
)

type AgentRepository interface {
	Save(ctx context.Context, agent *domain.Agent) error
	GetAll(ctx context.Context) ([]*domain.Agent, error)
	GetByID(ctx context.Context, id string) (*domain.Agent, error)
	Delete(ctx context.Context, id string) error
}
