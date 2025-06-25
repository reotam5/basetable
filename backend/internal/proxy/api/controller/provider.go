package controller

import (
	"encoding/json"
	"net/http"

	"github.com/go-chi/chi"

	"github.com/basetable/basetable/backend/internal/proxy/api/payload"
	"github.com/basetable/basetable/backend/internal/proxy/application/dto"
	"github.com/basetable/basetable/backend/internal/proxy/application/service"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
)

type ProviderController interface {
	CreateProvider(w http.ResponseWriter, r *http.Request)
	UpdateProviderTemplate(w http.ResponseWriter, r *http.Request)
	GetProvider(w http.ResponseWriter, r *http.Request)
	RemoveProvider(w http.ResponseWriter, r *http.Request)
	ListProviders(w http.ResponseWriter, r *http.Request)
	AddModels(w http.ResponseWriter, r *http.Request)
	RemoveModel(w http.ResponseWriter, r *http.Request)
	AddEndpoints(w http.ResponseWriter, r *http.Request)
	RemoveEndpoint(w http.ResponseWriter, r *http.Request)
	ActivateEndpoint(w http.ResponseWriter, r *http.Request)
	DeactivateEndpoint(w http.ResponseWriter, r *http.Request)
}

type providerController struct {
	providerService service.ProviderService
}

func NewProviderController(providerService service.ProviderService) ProviderController {
	return &providerController{providerService: providerService}

}

func (c *providerController) CreateProvider(w http.ResponseWriter, r *http.Request) {
	var req payload.CreateProviderRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	dtoReq := dto.CreateProviderRequest{
		Name:             req.Name,
		BaseURL:          req.BaseURL,
		RequestTemplate:  req.RequestTemplate,
		ResponseTemplate: req.ResponseTemplate,
		Headers:          req.Headers,
		Auth: dto.AuthConfig{
			Type:       req.Auth.Type,
			Header:     req.Auth.Header,
			Prefix:     req.Auth.Prefix,
			Credential: req.Auth.Credential,
		},
	}

	provider, err := c.providerService.CreateProvider(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	response := convertProviderDTOToPayload(provider.Provider)
	hutil.WriteJSONResponse(w, r, response)
}

func (c *providerController) UpdateProviderTemplate(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	var req payload.UpdateProviderTemplateRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	err := c.providerService.UpdateProviderTemplate(r.Context(), dto.UpdateProviderTemplateRequest{
		ProviderID:       providerID,
		RequestTemplate:  req.RequestTemplate,
		ResponseTemplate: req.ResponseTemplate,
	})
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *providerController) GetProvider(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	if providerID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	provider, err := c.providerService.GetProvider(r.Context(), providerID)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	response := convertProviderDTOToPayload(provider.Provider)
	hutil.WriteJSONResponse(w, r, response)
}

func (c *providerController) RemoveProvider(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	if providerID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	err := c.providerService.RemoveProvider(r.Context(), providerID)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *providerController) ListProviders(w http.ResponseWriter, r *http.Request) {
	providers, err := c.providerService.ListProviders(r.Context())
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	response := payload.ListProvidersResponse{
		Providers: make([]payload.ProviderResponse, len(providers.Providers)),
	}

	for i, provider := range providers.Providers {
		response.Providers[i] = convertProviderDTOToPayload(provider)
	}

	hutil.WriteJSONResponse(w, r, response)
}

func (c *providerController) AddModels(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	var req payload.AddModelsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	dtoReq := dto.AddModelsRequest{
		ProviderID: providerID,
		Models:     convertPayloadModelsToDTO(req.Models),
	}

	err := c.providerService.AddModels(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (c *providerController) RemoveModel(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	modelID := chi.URLParam(r, "modelID")
	if providerID == "" || modelID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	dtoReq := dto.RemoveModelRequest{
		ProviderID: providerID,
		ModelID:    modelID,
	}

	err := c.providerService.RemoveModel(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *providerController) AddEndpoints(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	if providerID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	var req payload.AddEndpointsRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	dtoReq := dto.AddEndpointsRequest{
		ProviderID: providerID,
		Endpoints:  convertPayloadEndpointsToDTO(req.Endpoints),
	}

	err := c.providerService.AddEndpoints(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusCreated)
}

func (c *providerController) RemoveEndpoint(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	endpointURL := chi.URLParam(r, "endpointURL")
	if providerID == "" || endpointURL == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	dtoReq := dto.RemoveEndpointRequest{
		ProviderID:  providerID,
		EndpointURL: endpointURL,
	}

	err := c.providerService.RemoveEndpoint(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

func (c *providerController) ActivateEndpoint(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	if providerID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	var req payload.ActivateEndpointRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	dtoReq := dto.ActivateEndpointRequest{
		ProviderID:  providerID,
		EndpointURL: req.EndpointURL,
	}

	err := c.providerService.ActivateEndpoint(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusOK)
}

func (c *providerController) DeactivateEndpoint(w http.ResponseWriter, r *http.Request) {
	providerID := chi.URLParam(r, "providerID")
	if providerID == "" {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(http.ErrMissingFile))
		return
	}

	var req payload.DeactivateEndpointRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	dtoReq := dto.DeactivateEndpointRequest{
		ProviderID:  providerID,
		EndpointURL: req.EndpointURL,
	}

	err := c.providerService.DeactivateEndpoint(r.Context(), dtoReq)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	w.WriteHeader(http.StatusOK)
}

// Helper conversion functions

func convertProviderDTOToPayload(provider dto.Provider) payload.ProviderResponse {
	return payload.ProviderResponse{
		ID:               provider.ID,
		Name:             provider.Name,
		BaseURL:          provider.BaseURL,
		Status:           provider.Status,
		Models:           convertDTOModelsToPayload(provider.Models),
		Endpoints:        convertDTOEndpointsToPayload(provider.Endpoints),
		RequestTemplate:  provider.RequestTemplate,
		ResponseTemplate: provider.ResponseTemplate,
		Headers:          provider.Headers,
	}
}

func convertDTOModelsToPayload(dtoModels map[string]dto.Model) map[string]payload.Model {
	payloadModels := make(map[string]payload.Model)
	for key, model := range dtoModels {
		payloadModels[key] = payload.Model{
			Name:        model.Name,
			Key:         model.Key,
			Description: model.Description,
			Capabilities: payload.Capabilities{
				FunctionCalling: model.Capabilities.FunctionCalling,
				Streaming:       model.Capabilities.Streaming,
			},
			Limits: payload.Limits{
				ContextWindow:   model.Limits.ContextWindow,
				MaxOutputTokens: model.Limits.MaxOutputTokens,
			},
			Pricing: payload.Pricing{
				PromptTokenPrice:     model.Pricing.PromptTokenPrice,
				CompletionTokenPrice: model.Pricing.CompletionTokenPrice,
				Currency:             model.Pricing.Currency,
				Unit:                 model.Pricing.Unit,
			},
		}
	}
	return payloadModels
}

func convertDTOEndpointsToPayload(dtoEndpoints map[string]dto.Endpoint) map[string]payload.Endpoint {
	payloadEndpoints := make(map[string]payload.Endpoint)
	for key, endpoint := range dtoEndpoints {
		payloadEndpoints[key] = payload.Endpoint{
			Name:            endpoint.Name,
			Path:            endpoint.Path,
			Status:          endpoint.Status,
			Health:          endpoint.Health,
			LastHealthCheck: endpoint.LastHealthCheck,
		}
	}
	return payloadEndpoints
}

func convertPayloadModelsToDTO(payloadModels []payload.Model) []dto.Model {
	dtoModels := make([]dto.Model, len(payloadModels))
	for i, model := range payloadModels {
		dtoModels[i] = dto.Model{
			Name:        model.Name,
			Key:         model.Key,
			Description: model.Description,
			Capabilities: dto.Capabilities{
				FunctionCalling: model.Capabilities.FunctionCalling,
				Streaming:       model.Capabilities.Streaming,
			},
			Limits: dto.Limits{
				ContextWindow:   model.Limits.ContextWindow,
				MaxOutputTokens: model.Limits.MaxOutputTokens,
			},
			Pricing: dto.Pricing{
				PromptTokenPrice:     model.Pricing.PromptTokenPrice,
				CompletionTokenPrice: model.Pricing.CompletionTokenPrice,
				Currency:             model.Pricing.Currency,
				Unit:                 model.Pricing.Unit,
			},
		}
	}
	return dtoModels
}

func convertPayloadEndpointsToDTO(payloadEndpoints []payload.Endpoint) []dto.Endpoint {
	dtoEndpoints := make([]dto.Endpoint, len(payloadEndpoints))
	for i, endpoint := range payloadEndpoints {
		dtoEndpoints[i] = dto.Endpoint{
			Name:            endpoint.Name,
			Path:            endpoint.Path,
			Status:          endpoint.Status,
			Health:          endpoint.Health,
			LastHealthCheck: endpoint.LastHealthCheck,
		}
	}
	return dtoEndpoints
}
