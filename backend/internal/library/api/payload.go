package api

type AddAgentRequest struct {
	Agent
}

type AddAgentResponse struct {
	AgentID string `json:"agent_id"`
}

type ListAgentsRequest struct {
	// add pagination and filtering later
}

type ListAgentsResponse struct {
	Agents []Agent `json:"agents"`
}

type Agent struct {
	ID              string                   `json:"id"`
	Name            string                   `json:"name"`
	Model           string                   `json:"model"`
	MCP             []MCPSettings            `json:"mcp"`
	SystemPrompt    string                   `json:"system_prompt"`
	CommPreferences CommunicationPreferences `json:"comm_preferences"`
}

type MCPSettings struct {
	Command   string            `json:"command"`
	Arguments []string          `json:"arguments"`
	Env       map[string]string `json:"env"`
}

type CommunicationPreferences struct {
	Tone  string `json:"tone"`
	Style string `json:"style"`
}
