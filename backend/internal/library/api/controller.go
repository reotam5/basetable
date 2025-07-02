package api

import (
	"encoding/json"
	"net/http"

	app "github.com/basetable/basetable/backend/internal/library/application"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

type LibraryController interface {
	AddAgent(w http.ResponseWriter, r *http.Request)
	ListAgents(w http.ResponseWriter, r *http.Request)
}

type libraryController struct {
	libraryService app.LibraryService
	logger         log.Logger
}

func NewLibraryController(libraryService app.LibraryService, logger log.Logger) LibraryController {
	return &libraryController{
		libraryService: libraryService,
		logger:         logger,
	}
}

func (c *libraryController) AddAgent(w http.ResponseWriter, r *http.Request) {
	var req AddAgentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Errorf("failed to decode request %v", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	responseDTO, err := c.libraryService.AddAgent(r.Context(), app.ShareAgentRequest{
		Agent: convertAgentPayloadToDTO(req.Agent),
	})

	if err != nil {
		c.logger.Errorf("Failed to add agent %v", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	c.logger.Infof("Successfully added agent: %v", responseDTO)
	hutil.WriteJSONResponseWithStatus(w, r, http.StatusCreated, AddAgentResponse{
		AgentID: responseDTO.AgentID,
	})
}

func (c *libraryController) ListAgents(w http.ResponseWriter, r *http.Request) {
	responseDTO, err := c.libraryService.ListAgents(r.Context(), app.ListAgentsRequest{})
	if err != nil {
		c.logger.Errorf("Failed to list agents %v", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	c.logger.Infof("Successfully listed agents: %v", responseDTO)

	agentsPayload := make([]Agent, len(responseDTO.Agents))
	for i, agent := range responseDTO.Agents {
		agentsPayload[i] = convertAgentDTOToPayload(agent)
	}
	hutil.WriteJSONResponse(w, r, ListAgentsResponse{
		Agents: agentsPayload,
	})
}

func convertAgentDTOToPayload(agent app.Agent) Agent {
	return Agent{
		ID:           agent.ID,
		Name:         agent.Name,
		Model:        agent.Model,
		MCP:          convertMCPSettingsDTOToPayload(agent.MCP),
		SystemPrompt: agent.SystemPrompt,
		CommPreferences: CommunicationPreferences{
			Tone:  agent.CommPreferences.Tone,
			Style: agent.CommPreferences.Style,
		},
	}
}

func convertAgentPayloadToDTO(agent Agent) app.Agent {
	return app.Agent{
		Name:         agent.Name,
		Model:        agent.Model,
		MCP:          convertPayloadMCPSettingsToDTO(agent.MCP),
		SystemPrompt: agent.SystemPrompt,
		CommPreferences: app.CommunicationPreferences{
			Tone:  agent.CommPreferences.Tone,
			Style: agent.CommPreferences.Style,
		},
	}
}

func convertMCPSettingsDTOToPayload(mcpSettings []app.MCPSettings) []MCPSettings {
	payloadMCPSettings := make([]MCPSettings, len(mcpSettings))
	for i, mcpSetting := range mcpSettings {
		payloadMCPSettings[i] = MCPSettings{
			Command:   mcpSetting.Command,
			Arguments: mcpSetting.Arguments,
			Env:       mcpSetting.Env,
		}
	}
	return payloadMCPSettings
}

func convertPayloadMCPSettingsToDTO(payloadMCPSettings []MCPSettings) []app.MCPSettings {
	dtoMCPSettings := make([]app.MCPSettings, len(payloadMCPSettings))
	for i, mcpSetting := range payloadMCPSettings {
		dtoMCPSettings[i] = app.MCPSettings{
			Command:   mcpSetting.Command,
			Arguments: mcpSetting.Arguments,
			Env:       mcpSetting.Env,
		}
	}
	return dtoMCPSettings
}
