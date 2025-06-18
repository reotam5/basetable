package model

import (
	"database/sql/driver"
	"encoding/json"
	"time"

	"github.com/basetable/basetable/backend/internal/proxy/domain/provider"
	"github.com/basetable/basetable/backend/internal/proxy/domain/provider/model"
	"github.com/google/uuid"
)

// HeadersJSON handles JSON serialization for headers map
type HeadersJSON map[string]string

func (h HeadersJSON) Value() (driver.Value, error) {
	if h == nil {
		return nil, nil
	}
	return json.Marshal(h)
}

func (h *HeadersJSON) Scan(value interface{}) error {
	if value == nil {
		*h = make(HeadersJSON)
		return nil
	}
	
	switch v := value.(type) {
	case []byte:
		return json.Unmarshal(v, h)
	case string:
		return json.Unmarshal([]byte(v), h)
	default:
		return nil
	}
}

// ProviderModel represents the GORM model for providers
type ProviderModel struct {
	ID               string      `gorm:"primaryKey;column:id"`
	Name             string      `gorm:"column:name;uniqueIndex"`
	BaseURL          string      `gorm:"column:base_url"`
	AuthType         string      `gorm:"column:auth_type"`
	AuthHeader       string      `gorm:"column:auth_header"`
	AuthPrefix       string      `gorm:"column:auth_prefix"`
	AuthCredential   string      `gorm:"column:auth_credential"`
	Headers          HeadersJSON `gorm:"column:headers;type:json"`
	Status           string      `gorm:"column:status"`
	RequestTemplate  string      `gorm:"column:request_template;type:text"`
	ResponseTemplate string      `gorm:"column:response_template;type:text"`
	UpdatedAt        time.Time   `gorm:"column:updated_at"`
	CreatedAt        time.Time   `gorm:"column:created_at"`

	// Relations
	Models    []ModelModel    `gorm:"foreignKey:ProviderID;constraint:OnDelete:CASCADE"`
	Endpoints []EndpointModel `gorm:"foreignKey:ProviderID;constraint:OnDelete:CASCADE"`
}

func (m *ProviderModel) TableName() string {
	return "providers"
}

// ModelModel represents the GORM model for provider models
type ModelModel struct {
	ID                   string  `gorm:"primaryKey;column:id"`
	ProviderID           string  `gorm:"column:provider_id;index"`
	Name                 string  `gorm:"column:name"`
	Key                  string  `gorm:"column:key"`
	Description          string  `gorm:"column:description"`
	FunctionCalling      bool    `gorm:"column:function_calling"`
	Streaming            bool    `gorm:"column:streaming"`
	ContextWindow        int     `gorm:"column:context_window"`
	MaxOutputTokens      int     `gorm:"column:max_output_tokens"`
	PromptTokenPrice     float64 `gorm:"column:prompt_token_price"`
	CompletionTokenPrice float64 `gorm:"column:completion_token_price"`
	Currency             string  `gorm:"column:currency"`
	PricingUnit          string  `gorm:"column:pricing_unit"`
}

func (m *ModelModel) TableName() string {
	return "provider_models"
}

// EndpointModel represents the GORM model for provider endpoints
type EndpointModel struct {
	ID              string    `gorm:"primaryKey;column:id"`
	ProviderID      string    `gorm:"column:provider_id;index"`
	Name            string    `gorm:"column:name"`
	Path            string    `gorm:"column:path"`
	Status          string    `gorm:"column:status"`
	Health          string    `gorm:"column:health"`
	LastHealthCheck time.Time `gorm:"column:last_health_check"`
}

func (m *EndpointModel) TableName() string {
	return "provider_endpoints"
}

// MapToDomain converts the GORM model to domain entity
func (m *ProviderModel) MapToDomain() (*provider.Provider, error) {
	// Convert models
	domainModels := make([]*model.Model, len(m.Models))
	for i, modelModel := range m.Models {
		domainModel, err := modelModel.MapToDomain()
		if err != nil {
			return nil, err
		}
		domainModels[i] = domainModel
	}

	// Convert endpoints
	domainEndpoints := make([]provider.Endpoint, len(m.Endpoints))
	for i, endpointModel := range m.Endpoints {
		domainEndpoints[i] = endpointModel.MapToDomain()
	}

	// Hydrate provider from persistence
	return provider.Hydrate(provider.HydrateData{
		ID:      provider.HydrateID(m.ID),
		Name:    m.Name,
		BaseURL: m.BaseURL,
		Auth: provider.AuthConfig{
			Type:   provider.AuthType(m.AuthType),
			Header: m.AuthHeader,
			Prefix: m.AuthPrefix,
			Credential: provider.Credential{
				Encrypted: m.AuthCredential,
			},
		},
		Headers: map[string]string(m.Headers),
		Status:  provider.Status(m.Status),
		RequestTemplate: provider.Template{
			Content: m.RequestTemplate,
		},
		ResponseTemplate: provider.Template{
			Content: m.ResponseTemplate,
		},
		Models:    domainModels,
		Endpoints: domainEndpoints,
		UpdatedAt: m.UpdatedAt,
	}), nil
}

// MapToDomain converts the model GORM model to domain entity
func (m *ModelModel) MapToDomain() (*model.Model, error) {
	return model.Hydrate(model.HydrateData{
		ID:          model.HydrateID(m.ID),
		Name:        m.Name,
		Key:         m.Key,
		Description: m.Description,
		Capabilities: model.Capabilities{
			FunctionCalling: m.FunctionCalling,
			Streaming:       m.Streaming,
		},
		Limits: model.Limits{
			ContextWindow:   m.ContextWindow,
			MaxOutputTokens: m.MaxOutputTokens,
		},
		Pricing: model.TokenPricing{
			Unit:                 model.PricingUnit(m.PricingUnit),
			PromptTokenPrice:     m.PromptTokenPrice,
			CompletionTokenPrice: m.CompletionTokenPrice,
			Currency:             m.Currency,
		},
	}), nil
}

// MapToDomain converts the endpoint GORM model to domain entity
func (m *EndpointModel) MapToDomain() provider.Endpoint {
	return provider.Endpoint{
		Name:            m.Name,
		Path:            m.Path,
		Status:          provider.EndpointStatus(m.Status),
		Health:          provider.EndpointHealth(m.Health),
		LastHealthCheck: m.LastHealthCheck,
	}
}

// MapDomainToModel converts domain provider to GORM model
func MapDomainToModel(p *provider.Provider) *ProviderModel {
	model := &ProviderModel{
		ID:               p.ID().String(),
		Name:             p.Name(),
		BaseURL:          p.BaseURL(),
		AuthType:         string(p.Auth().Type),
		AuthHeader:       p.Auth().Header,
		AuthPrefix:       p.Auth().Prefix,
		AuthCredential:   p.Auth().Credential.Encrypted,
		Headers:          HeadersJSON(p.Headers()),
		Status:           string(p.Status()),
		RequestTemplate:  p.RequestTemplate().Content,
		ResponseTemplate: p.ResponseTemplate().Content,
		UpdatedAt:        p.UpdatedAt(),
		CreatedAt:        time.Now(), // This will be set by GORM hooks if needed
	}

	// Convert models
	model.Models = make([]ModelModel, len(p.Models()))
	for i, domainModel := range p.Models() {
		model.Models[i] = MapDomainModelToModel(p.ID().String(), domainModel)
	}

	// Convert endpoints
	model.Endpoints = make([]EndpointModel, len(p.Endpoints()))
	for i, endpoint := range p.Endpoints() {
		model.Endpoints[i] = MapDomainEndpointToModel(p.ID().String(), endpoint)
	}

	return model
}

// MapDomainModelToModel converts domain model to GORM model
func MapDomainModelToModel(providerID string, m *model.Model) ModelModel {
	return ModelModel{
		ID:                   m.ID().String(),
		ProviderID:           providerID,
		Name:                 m.Name(),
		Key:                  m.Key(),
		Description:          m.Description(),
		FunctionCalling:      m.Capabilities().FunctionCalling,
		Streaming:            m.Capabilities().Streaming,
		ContextWindow:        m.Limits().ContextWindow,
		MaxOutputTokens:      m.Limits().MaxOutputTokens,
		PromptTokenPrice:     m.Pricing().PromptTokenPrice,
		CompletionTokenPrice: m.Pricing().CompletionTokenPrice,
		Currency:             m.Pricing().Currency,
		PricingUnit:          string(m.Pricing().Unit),
	}
}

// MapDomainEndpointToModel converts domain endpoint to GORM model
func MapDomainEndpointToModel(providerID string, e provider.Endpoint) EndpointModel {
	return EndpointModel{
		ID:              uuid.New().String(), // Generate unique persistence ID (not domain-relevant)
		ProviderID:      providerID,
		Name:            e.Name,
		Path:            e.Path,
		Status:          string(e.Status),
		Health:          string(e.Health),
		LastHealthCheck: e.LastHealthCheck,
	}
}
