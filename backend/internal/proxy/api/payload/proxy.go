package payload

// ProxyRequest represents the JSON payload for proxy requests
type ProxyRequest struct {
	ProviderID string      `json:"provider_id"`
	Endpoint   string      `json:"endpoint"`
	ModelKey   string      `json:"model_key"`
	Messages   []Message   `json:"messages"`
	Stream     bool        `json:"stream"`
	Tools      []Tool      `json:"tools,omitempty"`
	ToolChoice *ToolChoice `json:"tool_choice,omitempty"`
}

type Content []Part

type PartType string

type Part struct {
	Type       PartType `json:"type"`
	Body       string   `json:"body"`
	MediaType  string   `json:"media_type,omitempty"` // for image. specify JPEG, PNG, GIF, or WebP
	ToolCallID string   `json:"tool_call_id,omitempty"` // for tool parts
}

// Message represents a chat message
type Message struct {
	Role      string     `json:"role"`
	Content   Content    `json:"content"`
	ToolCalls []ToolCall `json:"tool_calls,omitempty"`
}

// Delta represents a delta object
type Delta struct {
	Role      string     `json:"role"`
	Content   Content    `json:"content"`
	ToolCalls []ToolCall `json:"tool_calls,omitempty"` // add omitempty if optional
}

// Tool represents a function tool definition
type Tool struct {
	ToolType       string         `json:"tool_type"`
	ToolDefinition ToolDefinition `json:"tool_definition"`
}

// ToolDefinition represents the definition of a tool
type ToolDefinition struct {
	Name        string          `json:"name"`
	Description string          `json:"description"`
	Parameters  ParameterSchema `json:"parameters"`
}

// ParameterSchema represents the schema for tool parameters
type ParameterSchema struct {
	Properties map[string]ParameterProperty `json:"properties"`
	Required   []string                     `json:"required"`
}

// ParameterProperty represents a parameter property
type ParameterProperty struct {
	Type        string      `json:"type"`
	Description string      `json:"description"`
	Enum        []string    `json:"enum,omitempty"`
	Default     interface{} `json:"default,omitempty"`
}

// ToolCall represents a tool call
type ToolCall struct {
	ID       string       `json:"id"`
	ToolType string       `json:"tool_type"`
	Call     FunctionCall `json:"call"`
}

// FunctionCall represents a function call
type FunctionCall struct {
	Name string `json:"name"`
	Arg  string `json:"arg"`
}

// ToolChoice represents tool choice configuration
type ToolChoice struct {
	Type         string  `json:"type"`
	FunctionName *string `json:"function_name,omitempty"`
}

// ProxyResponse represents the JSON response from proxy requests
type ProxyResponse struct {
	Model         string         `json:"model"`
	Choices       []Choice       `json:"choices"`
	Provider      string         `json:"provider"`
	Usage         Usage          `json:"usage"`
	SearchResults []SearchResult `json:"search_results"`
}

type SearchResult struct {
	Title string `json:"title"`
	URL   string `json:"url"`
}

// Choice represents a response choice
type Choice struct {
	Index        int     `json:"index"`
	Message      Message `json:"message"`
	Delta        Delta   `json:"delta"`
	FinishReason string  `json:"finish_reason"`
}

// Usage represents token usage information
type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}
