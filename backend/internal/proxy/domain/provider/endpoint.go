package provider

import "time"

type Endpoint struct {
	Name            string
	Path            string
	Status          EndpointStatus
	Health          EndpointHealth
	LastHealthCheck time.Time
}

type EndpointStatus string

const (
	EndpointStatusActive   EndpointStatus = "active"
	EndpointStatusInactive EndpointStatus = "inactive"
)

func (s EndpointStatus) IsActive() bool {
	return s == EndpointStatusActive
}

func (s EndpointStatus) IsInactive() bool {
	return s == EndpointStatusInactive
}

type EndpointHealth string

const (
	EndpointHealthHealthy   EndpointHealth = "healthy"
	EndpointHealthDegraded  EndpointHealth = "degraded"
	EndpointHealthUnhealthy EndpointHealth = "unhealthy"
	EndpointHealthUnknown   EndpointHealth = "unknown"
)

func (h EndpointHealth) IsHealthy() bool {
	return h == EndpointHealthHealthy
}

func (h EndpointHealth) IsDegraded() bool {
	return h == EndpointHealthDegraded
}

func (h EndpointHealth) IsUnhealthy() bool {
	return h == EndpointHealthUnhealthy
}

func (h EndpointHealth) IsUnknown() bool {
	return h == EndpointHealthUnknown
}

func (e Endpoint) WithStatus(status EndpointStatus) Endpoint {
	e.Status = status
	return e
}

func (e Endpoint) WithHealth(health EndpointHealth) Endpoint {
	e.Health = health
	return e
}

func (e Endpoint) WithLastHealthCheck(lastHealthCheck time.Time) Endpoint {
	e.LastHealthCheck = lastHealthCheck
	return e
}
