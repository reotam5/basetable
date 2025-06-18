package provider

import (
	"errors"
	"strings"
)

type AuthConfig struct {
	Type       AuthType
	Header     string
	Prefix     string
	Credential Credential
}

type AuthType string

const (
	AuthTypeBearer AuthType = "bearer"
	AuthTypeAPIKey AuthType = "apikey"
)

type Credential struct {
	Encrypted string
}

func (cfg AuthConfig) Validate() error {
	switch cfg.Type {
	case AuthTypeBearer, AuthTypeAPIKey:
		// ok

	default:
		return errors.New("invalid auth type")
	}

	if strings.TrimSpace(cfg.Header) == "" {
		return errors.New("authheader is required")
	}

	if strings.TrimSpace(cfg.Credential.Encrypted) == "" {
		return errors.New("credential is required")
	}

	if cfg.Type == AuthTypeBearer && strings.EqualFold(cfg.Credential.Encrypted, "Bearer") {
		return errors.New("apikey is required")
	}

	return nil
}
