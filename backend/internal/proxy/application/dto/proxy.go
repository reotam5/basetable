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
}

type Response struct {
	Model         string
	Choices       []Choice
	Provider      string
	Usage         Usage
	SearchResults []SearchResult
}

type SearchResult struct {
	Title string
	URL   string
}

type Choice struct {
	Index        int
	Message      Message
	Delta        Delta
	FinishReason FinishReason
}

type Content []Part

type PartType string

const (
	PartTypeText  PartType = "text"
	PartTypeThink PartType = "think" // for reasoning models
	PartTypeTool  PartType = "tool"
	PartTypeFile  PartType = "file"  // Support PDF. For other text-based format (.txt, .csv, .html), use text.
	PartTypeImage PartType = "image" // Support JPEG, PNG, GIF, or WebP.
)

type Part struct {
	Type       PartType
	Body       string
	MediaType  string // for image. specify jpeg, png, gif, or webp
	ToolCallID string // for tool parts
}

type Delta struct {
	Role      string
	Content   Content
	ToolCalls []ToolCall
}

type Message struct {
	Role      MessageRole
	Content   Content
	ToolCalls []ToolCall
}

type Usage struct {
	PromptTokens     int
	CompletionTokens int
	TotalTokens      int
}

type FinishReason string

const (
	FinishReasonStop      FinishReason = "stop"
	FinishReasonLength    FinishReason = "length"
	FinishReasonToolCalls FinishReason = "tool_calls"
)
