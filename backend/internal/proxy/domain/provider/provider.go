package provider

import (
	"errors"
	"fmt"
	"slices"
	"time"

	"github.com/basetable/basetable/backend/internal/proxy/domain/provider/model"
	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type ID = domain.ID[Provider]

var (
	NewID     = domain.NewID[Provider]
	HydrateID = domain.HydrateID[Provider]
)

type Status string

const (
	StatusActive   Status = "active"
	StatusInactive Status = "inactive"
)

func (s Status) String() string {
	return string(s)
}

type Provider struct {
	id      ID
	name    string
	baseURL string

	auth    AuthConfig
	headers map[string]string
	// ratelimits RateLimits
	status           Status
	endpoints        []Endpoint
	models           []*model.Model
	requestTemplate  Template
	responseTemplate Template
	updatedAt        time.Time
}

type Config struct {
	Name         string
	BaseURL      string
	Auth         AuthConfig
	Headers      map[string]string
	RequestTmpl  Template
	ResponseTmpl Template
}

func (cfg Config) Validate() error {
	if cfg.Name == "" || cfg.BaseURL == "" {
		return errors.New("name and baseURL are required")
	}

	if err := cfg.Auth.Validate(); err != nil {
		return err
	}

	if cfg.RequestTmpl.Content == "" || cfg.ResponseTmpl.Content == "" {
		return errors.New("request/response template is required")
	}

	return nil
}

func New(cfg Config) (*Provider, error) {
	if err := cfg.Validate(); err != nil {
		return nil, err
	}

	return &Provider{
		id:               NewID(),
		name:             cfg.Name,
		baseURL:          cfg.BaseURL,
		auth:             cfg.Auth,
		headers:          cfg.Headers,
		status:           StatusActive,
		requestTemplate:  cfg.RequestTmpl,
		responseTemplate: cfg.ResponseTmpl,
		updatedAt:        time.Now(),
	}, nil

}

type HydrateData struct {
	ID               ID
	Name             string
	BaseURL          string
	Auth             AuthConfig
	Headers          map[string]string
	Status           Status
	RequestTemplate  Template
	ResponseTemplate Template
	Models           []*model.Model
	Endpoints        []Endpoint
	UpdatedAt        time.Time
}

func Hydrate(data HydrateData) *Provider {
	return &Provider{
		id:               data.ID,
		name:             data.Name,
		baseURL:          data.BaseURL,
		auth:             data.Auth,
		headers:          data.Headers,
		status:           data.Status,
		requestTemplate:  data.RequestTemplate,
		responseTemplate: data.ResponseTemplate,
		models:           data.Models,
		endpoints:        data.Endpoints,
		updatedAt:        data.UpdatedAt,
	}
}

func (p *Provider) ID() ID {
	return p.id
}

func (p *Provider) Name() string {
	return p.name
}

func (p *Provider) BaseURL() string {
	return p.baseURL
}

func (p *Provider) Auth() AuthConfig {
	return p.auth
}

func (p *Provider) Headers() map[string]string {
	return p.headers
}

func (p *Provider) Status() Status {
	return p.status
}

func (p *Provider) Endpoints() []Endpoint {
	return p.endpoints
}

func (p *Provider) AddModel(
	name string,
	key string,
	description string,
	capabilities model.Capabilities,
	limits model.Limits,
	pricing model.TokenPricing,
) (model.ID, error) {
	for _, model := range p.models {
		if model.Key() == key {
			return model.ID(), errors.New("model already exists")
		}
	}

	model := model.New(name, key, description, capabilities, limits, pricing)
	p.models = append(p.models, model)
	p.updatedAt = time.Now()
	return model.ID(), nil
}

func (p *Provider) RemoveModel(modelID model.ID) error {
	for i, model := range p.models {
		if model.ID() == modelID {
			p.models = slices.Delete(p.models, i, i+1)
			p.updatedAt = time.Now()
			return nil
		}
	}

	return errors.New("model not found")
}

func (p *Provider) Models() []*model.Model {
	return p.models
}

func (p *Provider) AddEndpoint(name, path string) error {
	for _, endpoint := range p.endpoints {
		if endpoint.Name == name || endpoint.Path == path {
			return errors.New("endpoint already exists")
		}
	}

	p.endpoints = append(p.endpoints, Endpoint{
		Name:   name,
		Path:   path,
		Status: EndpointStatusActive,
		Health: EndpointHealthUnknown,
	})
	return nil
}

func (p *Provider) RemoveEndpoint(endpointName string) error {
	for i, endpoint := range p.endpoints {
		if endpoint.Name == endpointName {
			p.endpoints = slices.Delete(p.endpoints, i, i+1)
			return nil
		}
	}
	return errors.New("endpoint not found")
}

func (p *Provider) DeactivateEndpoint(endpointName string) error {
	for i, ep := range p.endpoints {
		if ep.Name == endpointName {
			if ep.Status.IsInactive() {
				return errors.New("endpoint is already inactive")
			}

			p.endpoints[i] = ep.
				WithStatus(EndpointStatusInactive).
				WithHealth(EndpointHealthUnknown).
				WithLastHealthCheck(time.Time{})
		}
	}
	return errors.New("endpoint not found")
}

func (p *Provider) ActivateEndpoint(endpointName string) error {
	for i, ep := range p.endpoints {
		if ep.Name == endpointName {
			if ep.Status.IsActive() {
				return errors.New("endpoint is already active")
			}

			p.endpoints[i] = ep.WithStatus(EndpointStatusActive)
			return nil
		}
	}
	return errors.New("endpoint not found")
}

func (p *Provider) UpdatedAt() time.Time {
	return p.updatedAt
}

func (p *Provider) RequestTemplate() Template {
	return p.requestTemplate
}

func (p *Provider) ResponseTemplate() Template {
	return p.responseTemplate
}

func (p *Provider) IsActive() bool {
	return p.status == StatusActive
}

func (p *Provider) IsInactive() bool {
	return p.status == StatusInactive
}

func (p *Provider) Deactivate() error {
	if p.IsInactive() {
		return errors.New("provider is already inactive")
	}

	p.status = StatusInactive
	// for _, ep := range p.endpoints {
	// 	p.DeactivateEndpoint(ep.Name)
	// }
	p.updatedAt = time.Now()
	return nil
}

func (p *Provider) Activate() error {
	if p.IsActive() {
		return errors.New("provider is already active")
	}

	p.status = StatusActive
	// for _, ep := range p.endpoints {
	// 	p.ActivateEndpoint(ep.Name)
	// }
	p.updatedAt = time.Now()
	return nil
}

func (p *Provider) UpdateRequestTemplate(tmpl Template) {
	p.requestTemplate = tmpl
}

func (p *Provider) UpdateResponseTemplate(tmpl Template) {
	p.responseTemplate = tmpl
}

func (p *Provider) String() string {
	return fmt.Sprintf(
		"Provider{id: %s, name: %s, baseURL: %s, auth: %v, status: %s, updatedAt: %v}",
		p.id,
		p.name,
		p.baseURL,
		p.auth,
		p.status,
		p.updatedAt,
	)
}
