package application

type Agent struct {
	ID              string
	Name            string
	Model           string
	MCP             []MCPSettings
	SystemPrompt    string
	CommPreferences CommunicationPreferences
}

type MCPSettings struct {
	Command       string
	Arguments     []string
	Env           map[string]string
	SelectedTools []string
}

type CommunicationPreferences struct {
	Tone  string
	Style string
}

type ShareAgentRequest struct {
	Agent Agent
}

type ShareAgentResponse struct {
	AgentID string
}

type GetAgentRequest struct {
	AgentID string
}

type GetAgentResponse struct {
	Agent Agent
}

type ListAgentsRequest struct {
	// add pagination and filtering options
}

type ListAgentsResponse struct {
	Agents []Agent
}

type RemoveAgentRequest struct {
	AgentID string
}
