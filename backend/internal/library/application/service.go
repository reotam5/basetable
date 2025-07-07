package application

import (
	"context"

	"github.com/basetable/basetable/backend/internal/library/domain"
)

type LibraryService interface {
	AddAgent(ctx context.Context, request ShareAgentRequest) (*ShareAgentResponse, error)
	ListAgents(ctx context.Context, request ListAgentsRequest) (*ListAgentsResponse, error)
	RemoveAgent(ctx context.Context, request RemoveAgentRequest) error
}

type libraryService struct {
	agentRepostiroy AgentRepository
}

var _ LibraryService = (*libraryService)(nil)

func NewLibraryService(agentRepository AgentRepository) LibraryService {
	return &libraryService{
		agentRepostiroy: agentRepository,
	}
}

func (s *libraryService) AddAgent(ctx context.Context, request ShareAgentRequest) (*ShareAgentResponse, error) {
	commPrerferences, err := domain.NewCommunicationPreferencesFromStrings(
		request.Agent.CommPreferences.Tone,
		request.Agent.CommPreferences.Style,
	)
	if err != nil {
		return nil, err
	}

	agent := domain.NewAgent(
		request.Agent.Name,
		request.Agent.Model,
		s.mapMCPSettingsDTOtoDomain(request.Agent.MCP),
		request.Agent.SystemPrompt,
		commPrerferences,
	)

	if err := s.agentRepostiroy.Save(ctx, agent); err != nil {
		return nil, err
	}

	return &ShareAgentResponse{
		AgentID: agent.ID().String(),
	}, nil
}

func (s *libraryService) ListAgents(ctx context.Context, request ListAgentsRequest) (*ListAgentsResponse, error) {
	agents, err := s.agentRepostiroy.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	dtoAgents := make([]Agent, 0, len(agents))
	for _, agent := range agents {
		dtoAgents = append(dtoAgents, s.mapDomainToDTO(agent))
	}

	return &ListAgentsResponse{
		Agents: dtoAgents,
	}, nil
}

func (s libraryService) RemoveAgent(ctx context.Context, request RemoveAgentRequest) error {
	return s.agentRepostiroy.Delete(ctx, request.AgentID)
}

func (s libraryService) mapDomainToDTO(agent *domain.Agent) Agent {
	return Agent{
		ID:           agent.ID().String(),
		Name:         agent.Name(),
		Model:        agent.Model(),
		MCP:          s.mapDomainToDTOMCPSettings(agent.MCP()),
		SystemPrompt: agent.SystemPrompt(),
		CommPreferences: CommunicationPreferences{
			Tone:  agent.CommPreferences().Tone().String(),
			Style: agent.CommPreferences().Style().String(),
		},
	}
}

func (s libraryService) mapDomainToDTOMCPSettings(mcps []domain.MCPSettings) []MCPSettings {
	dtoMCPSettings := make([]MCPSettings, len(mcps))
	for i, mcp := range mcps {
		dtoMCPSettings[i] = MCPSettings{
			Command:       mcp.Command(),
			Arguments:     mcp.Arguments(),
			Env:           mcp.Env(),
			SelectedTools: mcp.SelectedTools(),
		}
	}
	return dtoMCPSettings
}

func (s libraryService) mapMCPSettingsDTOtoDomain(dto []MCPSettings) []domain.MCPSettings {
	mcps := make([]domain.MCPSettings, len(dto))
	for i, mcp := range dto {
		mcps[i] = domain.NewMCPSettings(mcp.Command, mcp.Arguments, mcp.Env, mcp.SelectedTools)
	}
	return mcps
}
