package model

import (
	"fmt"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type ID = domain.ID[Model]

var (
	NewID     = domain.NewID[Model]
	HydrateID = domain.HydrateID[Model]
)

type Model struct {
	id           ID
	name         string
	key          string
	description  string
	capabilities Capabilities
	limits       Limits
	pricing      TokenPricing
}

func New(
	name string,
	key string,
	description string,
	capabilities Capabilities,
	limits Limits,
	pricing TokenPricing,
) *Model {
	return &Model{
		id:           NewID(),
		name:         name,
		key:          key,
		description:  description,
		capabilities: capabilities,
		limits:       limits,
		pricing:      pricing,
	}
}

type HydrateData struct {
	ID           ID
	Name         string
	Key          string
	Description  string
	Capabilities Capabilities
	Limits       Limits
	Pricing      TokenPricing
}

func Hydrate(data HydrateData) *Model {
	return &Model{
		id:           data.ID,
		name:         data.Name,
		key:          data.Key,
		description:  data.Description,
		capabilities: data.Capabilities,
		limits:       data.Limits,
		pricing:      data.Pricing,
	}
}

func (m *Model) ID() ID {
	return m.id
}

func (m *Model) Name() string {
	return m.name
}

func (m *Model) Key() string {
	return m.key
}

func (m *Model) Description() string {
	return m.description
}

func (m *Model) Capabilities() Capabilities {
	return m.capabilities
}

func (m *Model) Limits() Limits {
	return m.limits
}

func (m *Model) Pricing() TokenPricing {
	return m.pricing
}

func (m *Model) String() string {
	return fmt.Sprintf(
		"Model{id: %s, name: %s, key: %s, capabilities: %v, limits: %v, pricing: %v}",
		m.id,
		m.name,
		m.key,
		m.capabilities,
		m.limits,
		m.pricing,
	)
}
