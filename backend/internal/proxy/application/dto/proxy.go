package dto

type MessageRole string

const (
	MessageRoleSystem    MessageRole = "system"
	MessageRoleUser      MessageRole = "user"
	MessageRoleAssistant MessageRole = "assistant"
	MessageRoleTool      MessageRole = "tool"
)

func (r MessageRole) String() string {
	return string(r)
}

func (r MessageRole) IsValid() bool {
	switch r {
	case MessageRoleSystem, MessageRoleUser, MessageRoleAssistant, MessageRoleTool:
		return true

	default:
		return false
	}
}

type Tool struct {
	ToolType       ToolType
	ToolDefinition ToolDefinition
}

type ToolType string

const (
	// just function for now
	ToolTypeFunction ToolType = "function"
)

func (t ToolType) String() string {
	return string(t)
}

func (t ToolType) IsValid() bool {
	switch t {
	case ToolTypeFunction:
		return true

	default:
		return false
	}
}

type ToolDefinition struct {
	Name        string
	Description string
	Parameters  ParameterSchema
}

type ParameterSchema struct {
	Properties map[string]ParameterProperty
	Required   []string
}

type ParameterProperty struct {
	Type        string
	Description string
	Enum        []string
	Default     interface{}
}

type ToolCall struct {
	ID       ToolCallID
	ToolType ToolType
	Call     FunctionCall
}

type ToolCallID string

type FunctionCall struct {
	Name string
	Arg  string
}

// ToolChoice controls function calling behavior
type ToolChoice struct {
	Type         ToolChoiceType
	FunctionName *string // only used when Type is Function
}

type ToolChoiceType string

const (
	ToolChoiceNone     ToolChoiceType = "none"     // Don't call any tool
	ToolChoiceAUto     ToolChoiceType = "auto"     // llm decides
	ToolChoiceFunction ToolChoiceType = "function" // must call a function
)

func (t ToolChoiceType) String() string {
	return string(t)
}

func (t ToolChoiceType) IsValid() bool {
	switch t {
	case ToolChoiceNone, ToolChoiceAUto, ToolChoiceFunction:
		return true

	default:
		return false
	}
}

type Request struct {
	ProviderID string
	Endpoint   string
	ModelKey   string
	Messages   []Message
	Stream     bool
	Tools      []Tool
	ToolChoice ToolChoice

	// temp *float64
	// maxToken *int
}

type Response struct {
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

type Choice struct {
	Index        int          `json:"index"`
	Message      Message      `json:"message"`
	Delta        Delta        `json:"delta"`
	FinishReason FinishReason `json:"finish_reason"`
}

type Delta struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type Message struct {
	Role      MessageRole `json:"role"`
	Content   string      `json:"content"`
	Toolcalls []ToolCall  `json:"toolcalls,omitempty"` // add omitempty if optional
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

type FinishReason string

const (
	FinishReasonStop     FinishReason = "stop"
	FinishReasonLength   FinishReason = "length"
	FinishReasonToolCall FinishReason = "tool_call"
)
