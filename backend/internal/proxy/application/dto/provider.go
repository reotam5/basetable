package dto

import "time"

type Provider struct {
	ID               string
	Name             string
	BaseURL          string
	Status           string
	Models           map[string]Model
	Endpoints        map[string]Endpoint
	RequestTemplate  string
	ResponseTemplate string
	Headers          map[string]string

	// internal field, do not expose
	AuthConfig AuthConfig
}

type Model struct {
	Name         string
	Key          string
	Description  string
	Capabilities Capabilities
	Limits       Limits
	Pricing      Pricing
}

type Capabilities struct {
	FunctionCalling bool
	Streaming       bool
}

type Limits struct {
	ContextWindow   int
	MaxOutputTokens int
}

type Pricing struct {
	PromptTokenPrice     float64
	CompletionTokenPrice float64
	Currency             string
	Unit                 string
}

type GetProviderResponse struct {
	Provider
}

type ListProvidersResponse struct {
	Providers []Provider
}

type CreateProviderRequest struct {
	Name             string
	BaseURL          string
	RequestTemplate  string
	ResponseTemplate string
	Headers          map[string]string
	Auth             AuthConfig
}

type CreateProviderResponse struct {
	Provider
}

type AuthConfig struct {
	Type       string
	Header     string
	Prefix     string
	Credential string
}

type AddModelsRequest struct {
	ProviderID string
	Models     []Model
}

type RemoveModelRequest struct {
	ProviderID string
	ModelID    string
}

type AddEndpointsRequest struct {
	ProviderID string
	Endpoints  []Endpoint
}

type RemoveEndpointRequest struct {
	ProviderID  string
	EndpointURL string
}

type Endpoint struct {
	Name            string
	Path            string
	Status          string
	Health          string
	LastHealthCheck time.Time
}

type ActivateEndpointRequest struct {
	ProviderID  string
	EndpointURL string
}

type DeactivateEndpointRequest struct {
	ProviderID  string
	EndpointURL string
}
