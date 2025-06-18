package service

import (
	"context"
	"errors"

	"github.com/basetable/basetable/backend/internal/proxy/application/dto"
	"github.com/basetable/basetable/backend/internal/proxy/application/repository"
	"github.com/basetable/basetable/backend/internal/proxy/domain/provider"
	"github.com/basetable/basetable/backend/internal/proxy/domain/provider/model"
	uow "github.com/basetable/basetable/backend/internal/shared/application/unitofwork"
)

type (
	UnitOfWork         = uow.UnitOfWork[repository.RepositoryProvider]
	ProviderRepository = repository.ProviderRepository
)

type ProviderService interface {
	GetProvider(ctx context.Context, id string) (*dto.GetProviderResponse, error)
	ListProviders(ctx context.Context) (*dto.ListProvidersResponse, error)
	CreateProvider(ctx context.Context, request dto.CreateProviderRequest) (*dto.CreateProviderResponse, error)
	RemoveProvider(ctx context.Context, id string) error
	AddModels(ctx context.Context, request dto.AddModelsRequest) error
	RemoveModel(ctx context.Context, request dto.RemoveModelRequest) error
	AddEndpoints(ctx context.Context, request dto.AddEndpointsRequest) error
	RemoveEndpoint(ctx context.Context, request dto.RemoveEndpointRequest) error
	ActivateEndpoint(ctx context.Context, request dto.ActivateEndpointRequest) error
	DeactivateEndpoint(ctx context.Context, request dto.DeactivateEndpointRequest) error
}

var _ ProviderService = (*providerService)(nil)

type providerService struct {
	providerRepository ProviderRepository
	uow                UnitOfWork
}

func NewProviderService(
	providerRepository ProviderRepository,
	uow UnitOfWork,
) ProviderService {
	return &providerService{
		providerRepository: providerRepository,
		uow:                uow,
	}
}

func (s *providerService) GetProvider(ctx context.Context, id string) (*dto.GetProviderResponse, error) {
	provider, err := s.providerRepository.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}

	return &dto.GetProviderResponse{
		Provider: s.mapDomainToDTO(provider),
	}, nil
}

func (s *providerService) ListProviders(ctx context.Context) (*dto.ListProvidersResponse, error) {
	providers, err := s.providerRepository.GetAll(ctx)
	if err != nil {
		return nil, err
	}

	dtoProviders := make([]dto.Provider, 0, len(providers))
	for _, provider := range providers {
		dtoProviders = append(dtoProviders, s.mapDomainToDTO(provider))
	}

	return &dto.ListProvidersResponse{
		Providers: dtoProviders,
	}, nil
}

func (s *providerService) CreateProvider(ctx context.Context, request dto.CreateProviderRequest) (*dto.CreateProviderResponse, error) {
	provider, err := provider.New(provider.Config{
		Name:    request.Name,
		BaseURL: request.BaseURL,
		Auth: provider.AuthConfig{
			Type:   provider.AuthTypeAPIKey, // just api key for now
			Header: request.Auth.Header,
			Prefix: request.Auth.Prefix,
			Credential: provider.Credential{
				Encrypted: request.Auth.Credential,
			},
		},
		Headers: request.Headers,
		RequestTmpl: provider.Template{
			Content: request.RequestTemplate,
		},
		ResponseTmpl: provider.Template{
			Content: request.ResponseTemplate,
		},
	})
	if err != nil {
		return nil, err
	}

	err = s.providerRepository.Save(ctx, provider)
	if err != nil {
		return nil, err
	}

	return &dto.CreateProviderResponse{
		Provider: s.mapDomainToDTO(provider),
	}, nil
}

func (s *providerService) RemoveProvider(ctx context.Context, provider_id string) error {
	return s.providerRepository.Delete(ctx, provider_id)
}

func (s *providerService) AddModels(ctx context.Context, request dto.AddModelsRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, request.ProviderID)
		if err != nil {
			return err
		}

		var errs []error
		for _, mod := range request.Models {
			if _, err := provider.AddModel(
				mod.Name,
				mod.Key,
				mod.Description,
				model.Capabilities{
					FunctionCalling: mod.Capabilities.FunctionCalling,
					Streaming:       mod.Capabilities.Streaming,
				},
				model.Limits{
					ContextWindow:   mod.Limits.ContextWindow,
					MaxOutputTokens: mod.Limits.MaxOutputTokens,
				},
				model.TokenPricing{
					PromptTokenPrice:     mod.Pricing.PromptTokenPrice,
					CompletionTokenPrice: mod.Pricing.CompletionTokenPrice,
					Currency:             mod.Pricing.Currency,
					Unit:                 model.UnitPer1000Tokens, // just 1000 for now
				},
			); err != nil {
				errs = append(errs, err)
			}
		}

		if len(errs) > 0 {
			return errors.Join(errs...)
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})
}

func (s *providerService) RemoveModel(ctx context.Context, request dto.RemoveModelRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, request.ProviderID)
		if err != nil {
			return err
		}

		if err := provider.RemoveModel(model.HydrateID(request.ModelID)); err != nil {
			return err
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})
}

func (s *providerService) AddEndpoints(ctx context.Context, req dto.AddEndpointsRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, req.ProviderID)
		if err != nil {
			return err
		}

		var errs []error
		for _, ep := range req.Endpoints {
			if err := provider.AddEndpoint(ep.Name, ep.Path); err != nil {
				errs = append(errs, err)
			}
		}

		if len(errs) > 0 {
			return errors.Join(errs...)
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})

}

func (s *providerService) RemoveEndpoint(ctx context.Context, req dto.RemoveEndpointRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, req.ProviderID)
		if err != nil {
			return err
		}

		if err := provider.RemoveEndpoint(req.EndpointURL); err != nil {
			return err
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})
}

func (s *providerService) ActivateEndpoint(ctx context.Context, req dto.ActivateEndpointRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, req.ProviderID)
		if err != nil {
			return err
		}

		if err := provider.ActivateEndpoint(req.EndpointURL); err != nil {
			return err
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})
}

func (s *providerService) DeactivateEndpoint(ctx context.Context, req dto.DeactivateEndpointRequest) error {
	return s.uow.Do(ctx, func(ctx context.Context, repoProvider repository.RepositoryProvider) error {
		provider, err := repoProvider.ProviderRepository().GetByIDForUpdate(ctx, req.ProviderID)
		if err != nil {
			return err
		}

		if err := provider.DeactivateEndpoint(req.EndpointURL); err != nil {
			return err
		}

		return repoProvider.ProviderRepository().Save(ctx, provider)
	})
}

func (s *providerService) mapDomainToDTO(provider *provider.Provider) dto.Provider {
	dtoModels := make(map[string]dto.Model, len(provider.Models()))
	dtoEndpoints := make(map[string]dto.Endpoint, len(provider.Endpoints()))
	for _, model := range provider.Models() {
		dtoModels[model.Key()] = dto.Model{
			Name:        model.Name(),
			Key:         model.Key(),
			Description: model.Description(),
			Capabilities: dto.Capabilities{
				FunctionCalling: model.Capabilities().FunctionCalling,
				Streaming:       model.Capabilities().Streaming,
			},
			Limits: dto.Limits{
				ContextWindow:   model.Limits().ContextWindow,
				MaxOutputTokens: model.Limits().MaxOutputTokens,
			},
			Pricing: dto.Pricing{
				PromptTokenPrice:     model.Pricing().PromptTokenPrice,
				CompletionTokenPrice: model.Pricing().CompletionTokenPrice,
				Currency:             model.Pricing().Currency,
				Unit:                 model.Pricing().Unit.String(),
			},
		}
	}

	for _, ep := range provider.Endpoints() {
		dtoEndpoints[ep.Name] = dto.Endpoint{
			Name:            ep.Name,
			Path:            ep.Path,
			Status:          string(ep.Status),
			Health:          string(ep.Health),
			LastHealthCheck: ep.LastHealthCheck,
		}
	}
	return dto.Provider{
		ID:               provider.ID().String(),
		Name:             provider.Name(),
		BaseURL:          provider.BaseURL(),
		Status:           provider.Status().String(),
		Models:           dtoModels,
		Endpoints:        dtoEndpoints,
		RequestTemplate:  provider.RequestTemplate().Content,
		ResponseTemplate: provider.ResponseTemplate().Content,
		Headers:          provider.Headers(),
		AuthConfig: dto.AuthConfig{
			Type:       string(provider.Auth().Type),
			Header:     provider.Auth().Header,
			Prefix:     provider.Auth().Prefix,
			Credential: provider.Auth().Credential.Encrypted,
		},
	}
}
