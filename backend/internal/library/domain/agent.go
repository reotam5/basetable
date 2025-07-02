package domain

import "github.com/basetable/basetable/backend/internal/shared/domain"

type ID = domain.ID[Agent]

var (
	NewID     = domain.NewID[Agent]
	HydrateID = domain.HydrateID[Agent]
)

type Agent struct {
	id              ID
	name            string
	model           string
	mcp             []MCPSettings
	systemPrompt    string
	commPreferences CommunicationPreferences
}

func NewAgent(
	name string,
	model string,
	mcp []MCPSettings,
	systemPrompt string,
	commPreferences CommunicationPreferences,
) *Agent {
	return &Agent{
		id:              NewID(),
		name:            name,
		model:           model,
		mcp:             mcp,
		systemPrompt:    systemPrompt,
		commPreferences: commPreferences,
	}
}

func (a *Agent) ID() ID {
	return a.id
}

func (a *Agent) Name() string {
	return a.name
}

func (a *Agent) Model() string {
	return a.model
}

func (a *Agent) MCP() []MCPSettings {
	return a.mcp
}

func (a *Agent) SystemPrompt() string {
	return a.systemPrompt
}

func (a *Agent) CommPreferences() CommunicationPreferences {
	return a.commPreferences
}

func Hydrate(
	id string,
	name string,
	model string,
	mcp []MCPSettings,
	systemPrompt string,
	commPreferences CommunicationPreferences,
) *Agent {
	return &Agent{
		id:              HydrateID(id),
		name:            name,
		model:           model,
		mcp:             mcp,
		systemPrompt:    systemPrompt,
		commPreferences: commPreferences,
	}
}
