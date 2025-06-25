package payload

import "time"

// CreateProviderRequest represents the payload for creating a provider
type CreateProviderRequest struct {
	Name             string            `json:"name"`
	BaseURL          string            `json:"base_url"`
	RequestTemplate  string            `json:"request_template"`
	ResponseTemplate string            `json:"response_template"`
	Headers          map[string]string `json:"headers,omitempty"`
	Auth             AuthConfig        `json:"auth"`
}

type UpdateProviderTemplateRequest struct {
	RequestTemplate  string `json:"request_template"`
	ResponseTemplate string `json:"response_template"`
}

// AuthConfig represents authentication configuration
type AuthConfig struct {
	Type       string `json:"type"`
	Header     string `json:"header"`
	Prefix     string `json:"prefix"`
	Credential string `json:"credential"`
}

// ProviderResponse represents a provider in API responses
type ProviderResponse struct {
	ID               string              `json:"id"`
	Name             string              `json:"name"`
	BaseURL          string              `json:"base_url"`
	Status           string              `json:"status"`
	Models           map[string]Model    `json:"models"`
	Endpoints        map[string]Endpoint `json:"endpoints"`
	RequestTemplate  string              `json:"request_template"`
	ResponseTemplate string              `json:"response_template"`
	Headers          map[string]string   `json:"headers,omitempty"`
}

// Model represents a model configuration
type Model struct {
	Name         string       `json:"name"`
	Key          string       `json:"key"`
	Description  string       `json:"description"`
	Capabilities Capabilities `json:"capabilities"`
	Limits       Limits       `json:"limits"`
	Pricing      Pricing      `json:"pricing"`
}

// Capabilities represents model capabilities
type Capabilities struct {
	FunctionCalling bool `json:"function_calling"`
	Streaming       bool `json:"streaming"`
}

// Limits represents model limits
type Limits struct {
	ContextWindow   int `json:"context_window"`
	MaxOutputTokens int `json:"max_output_tokens"`
}

// Pricing represents model pricing
type Pricing struct {
	PromptTokenPrice     float64 `json:"prompt_token_price"`
	CompletionTokenPrice float64 `json:"completion_token_price"`
	Currency             string  `json:"currency"`
	Unit                 string  `json:"unit"`
}

// Endpoint represents an endpoint configuration
type Endpoint struct {
	Name            string    `json:"name"`
	Path            string    `json:"path"`
	Status          string    `json:"status"`
	Health          string    `json:"health"`
	LastHealthCheck time.Time `json:"last_health_check"`
}

// ListProvidersResponse represents the response for listing providers
type ListProvidersResponse struct {
	Providers []ProviderResponse `json:"providers"`
}

// AddModelsRequest represents the payload for adding models to a provider
type AddModelsRequest struct {
	Models []Model `json:"models"`
}

// AddEndpointsRequest represents the payload for adding endpoints to a provider
type AddEndpointsRequest struct {
	Endpoints []Endpoint `json:"endpoints"`
}

// ActivateEndpointRequest represents the payload for activating an endpoint
type ActivateEndpointRequest struct {
	EndpointURL string `json:"endpoint_url"`
}

// DeactivateEndpointRequest represents the payload for deactivating an endpoint
type DeactivateEndpointRequest struct {
	EndpointURL string `json:"endpoint_url"`
}
