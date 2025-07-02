package gorm

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/basetable/basetable/backend/internal/library/domain"
)

// MCPSettingsJSON handles JSON serialization for MCP settings slice
type MCPSettingsJSON []MCPSettingsData

type MCPSettingsData struct {
	Command   string            `json:"command"`
	Arguments []string          `json:"arguments"`
	Env       map[string]string `json:"env"`
}

func (m MCPSettingsJSON) Value() (driver.Value, error) {
	if m == nil {
		return nil, nil
	}
	return json.Marshal(m)
}

func (m *MCPSettingsJSON) Scan(value any) error {
	if value == nil {
		*m = make(MCPSettingsJSON, 0)
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, m)
	case string:
		return json.Unmarshal([]byte(v), m)
	default:
		return nil
	}
}

// AgentModel represents the GORM model for agents
type AgentModel struct {
	ID           string              `gorm:"primaryKey;column:id"`
	Name         string              `gorm:"column:name"`
	Model        string              `gorm:"column:model"`
	MCP          MCPSettingsJSON     `gorm:"column:mcp;type:json"`
	SystemPrompt string              `gorm:"column:system_prompt;type:text"`
	CommTone     string              `gorm:"column:comm_tone"`
	CommStyle    string              `gorm:"column:comm_style"`
	CreatedAt    time.Time           `gorm:"column:created_at"`
	UpdatedAt    time.Time           `gorm:"column:updated_at"`
}

func (m *AgentModel) TableName() string {
	return "agents"
}

// MapToDomain converts the GORM model to domain entity
func (m *AgentModel) MapToDomain() (*domain.Agent, error) {
	// Convert MCP settings
	mcpSettings := make([]domain.MCPSettings, len(m.MCP))
	for i, mcpData := range m.MCP {
		mcpSettings[i] = domain.NewMCPSettings(
			mcpData.Command,
			mcpData.Arguments,
			mcpData.Env,
		)
	}

	// Convert communication preferences
	commPrefs, err := domain.NewCommunicationPreferencesFromStrings(
		m.CommTone,
		m.CommStyle,
	)
	if err != nil {
		return nil, err
	}

	// Hydrate agent from persistence
	hydratedAgent := domain.Hydrate(
		m.ID,
		m.Name,
		m.Model,
		mcpSettings,
		m.SystemPrompt,
		commPrefs,
	)

	return hydratedAgent, nil
}

// MapDomainToModel converts domain agent to GORM model
func MapDomainToModel(a *domain.Agent) *AgentModel {
	// Convert MCP settings
	mcpData := make(MCPSettingsJSON, len(a.MCP()))
	for i, mcp := range a.MCP() {
		mcpData[i] = MCPSettingsData{
			Command:   mcp.Command(),
			Arguments: mcp.Arguments(),
			Env:       mcp.Env(),
		}
	}

	return &AgentModel{
		ID:           a.ID().String(),
		Name:         a.Name(),
		Model:        a.Model(),
		MCP:          mcpData,
		SystemPrompt: a.SystemPrompt(),
		CommTone:     a.CommPreferences().Tone().String(),
		CommStyle:    a.CommPreferences().Style().String(),
		CreatedAt:    time.Now(),
		UpdatedAt:    time.Now(),
	}
}