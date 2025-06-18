package service

import (
	"bufio"
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strings"
	"text/template"

	"github.com/basetable/basetable/backend/internal/proxy/application/dto"
)

type ProxyService interface {
	ProxyRequest(ctx context.Context, request dto.Request) (*dto.Response, error)
	ProxyRequestStream(ctx context.Context, request dto.Request) (<-chan *dto.Response, error)
}

type proxyService struct {
	providerService ProviderService
	proxyClient     ProxyClient
}

func NewProxyService(providerService ProviderService, proxyClient ProxyClient) ProxyService {
	return &proxyService{
		providerService: providerService,
		proxyClient:     proxyClient,
	}
}

func (s *proxyService) ProxyRequest(ctx context.Context, request dto.Request) (*dto.Response, error) {
	providerDTO, err := s.providerService.GetProvider(ctx, request.ProviderID)
	if err != nil {
		return nil, err
	}

	if providerDTO.Status != "active" {
		return nil, fmt.Errorf("provider is not active")
	}

	// if model is not supported, return error
	if _, ok := providerDTO.Models[request.ModelKey]; !ok {
		return nil, fmt.Errorf("model %s is not supported by provider", request.ModelKey)
	}

	// if endpoint is not supported or inactive, return error
	if ep, ok := providerDTO.Endpoints[request.Endpoint]; !ok || ep.Status == "inactive" {
		return nil, fmt.Errorf("endpoint %s is not available", request.Endpoint)
	}

	funcMap := template.FuncMap{
		"json": func(v interface{}) string {
			b, _ := json.Marshal(v)
			return string(b)
		},
	}
	// for now just convert template directly
	requestTmpl, err := template.
		New("request").
		Funcs(funcMap).
		Parse(providerDTO.RequestTemplate)
	if err != nil {
		return nil, err
	}

	responseTmpl, err := template.
		New("response").
		Funcs(funcMap).
		Parse(providerDTO.ResponseTemplate)
	if err != nil {
		return nil, err
	}

	var requestBody bytes.Buffer
	err = requestTmpl.Execute(&requestBody, request)
	if err != nil {
		return nil, err
	}

	target := fmt.Sprintf("%s/%s", providerDTO.BaseURL, providerDTO.Endpoints[request.Endpoint].Path)

	// Build auth header value with optional prefix
	authValue := providerDTO.AuthConfig.Credential
	if providerDTO.AuthConfig.Prefix != "" {
		authValue = fmt.Sprintf("%s %s", providerDTO.AuthConfig.Prefix, providerDTO.AuthConfig.Credential)
	}

	// Build headers map starting with defaults
	headers := map[string]string{
		"Content-Type": "application/json",
	}

	// Add extra headers from provider config
	for k, v := range providerDTO.Headers {
		headers[k] = v
	}

	// Add auth header
	headers[providerDTO.AuthConfig.Header] = authValue

	resp, err := s.proxyClient.ProxyRequest(ctx, ProxyRequest{
		Target:  target,
		Method:  "POST",
		Headers: headers,
		Body:    requestBody.Bytes(),
	})
	if err != nil {
		return nil, err
	}

	// Check if the response status code indicates an error
	if resp.StatusCode >= 400 {
		return nil, fmt.Errorf("provider returned error status: %d", resp.StatusCode)
	}

	// First decode the provider response JSON into a structured format
	var providerResponse any
	if err := json.Unmarshal(resp.Body, &providerResponse); err != nil {
		return nil, fmt.Errorf("failed to parse provider response JSON: %w", err)
	}

	// Convert the provider response back to canonical format using the response template
	var responseBody bytes.Buffer
	err = responseTmpl.Execute(&responseBody, providerResponse)
	if err != nil {
		return nil, fmt.Errorf("failed to execute response template: %w", err)
	}

	// Parse the template output into dto.Response
	var response dto.Response
	err = json.Unmarshal(responseBody.Bytes(), &response)
	if err != nil {
		return nil, fmt.Errorf("failed to parse response template output: %w", err)
	}

	return &response, nil
}

func (s *proxyService) ProxyRequestStream(ctx context.Context, request dto.Request) (<-chan *dto.Response, error) {
	providerDTO, err := s.providerService.GetProvider(ctx, request.ProviderID)
	if err != nil {
		return nil, err
	}

	if providerDTO.Status != "active" {
		return nil, fmt.Errorf("provider is not active")
	}

	// if model is not supported or streaming is not supported, return error
	if model, ok := providerDTO.Models[request.ModelKey]; !ok || !model.Capabilities.Streaming {
		return nil, fmt.Errorf("model %s is not supported by provider or streaming is not supported", request.ModelKey)
	}

	// if endpoint is not supported or inactive, return error
	if ep, ok := providerDTO.Endpoints[request.Endpoint]; !ok || ep.Status == "inactive" {
		return nil, fmt.Errorf("endpoint %s is not available", request.Endpoint)
	}

	funcMap := template.FuncMap{
		"json": func(v interface{}) string {
			b, _ := json.Marshal(v)
			return string(b)
		},
	}

	// Parse request template
	requestTmpl, err := template.
		New("request").
		Funcs(funcMap).
		Parse(providerDTO.RequestTemplate)
	if err != nil {
		fmt.Println("requestTmpl")
		return nil, err
	}

	// Use the same response template as non-streaming
	responseTmpl, err := template.
		New("response").
		Funcs(funcMap).
		Parse(providerDTO.ResponseTemplate)
	if err != nil {
		fmt.Println("responseTmpl")
		fmt.Println(err)
		return nil, err
	}

	// Force streaming by setting stream: true in the request
	request.Stream = true

	var requestBody bytes.Buffer
	err = requestTmpl.Execute(&requestBody, request)
	if err != nil {
		return nil, err
	}

	fmt.Println(requestBody.String())

	target := fmt.Sprintf("%s/%s", providerDTO.BaseURL, providerDTO.Endpoints[request.Endpoint].Path)

	// Build auth header value with optional prefix
	authValue := providerDTO.AuthConfig.Credential
	if providerDTO.AuthConfig.Prefix != "" {
		authValue = fmt.Sprintf("%s %s", providerDTO.AuthConfig.Prefix, providerDTO.AuthConfig.Credential)
	}

	// Build headers map starting with defaults
	headers := map[string]string{
		"Content-Type": "application/json",
		"Accept":       "text/event-stream",
	}

	// Add extra headers from provider config
	for k, v := range providerDTO.Headers {
		headers[k] = v
	}

	// Add auth header
	headers[providerDTO.AuthConfig.Header] = authValue

	streamReader, err := s.proxyClient.ProxyRequestStream(ctx, ProxyRequest{
		Target:  target,
		Method:  "POST",
		Headers: headers,
		Body:    requestBody.Bytes(),
	})
	if err != nil {
		return nil, err
	}

	// Create output channel
	responseChan := make(chan *dto.Response, 100)

	// Start goroutine to process stream
	go func() {
		defer close(responseChan)
		defer streamReader.Close()

		scanner := bufio.NewScanner(streamReader)

		for scanner.Scan() {
			line := strings.TrimSpace(scanner.Text())
			// Skip empty lines
			if line == "" {
				continue
			}

			// Skip comment lines (server-sent events format)
			if strings.HasPrefix(line, ":") {
				continue
			}

			// Handle "data: " prefix
			if strings.HasPrefix(line, "data: ") {
				data := strings.TrimPrefix(line, "data: ")

				// Handle [DONE] marker
				if data == "[DONE]" {
					return
				}

				fmt.Println(data)

				// Parse the provider response chunk (same format as non-streaming)
				var providerChunk any
				if err := json.Unmarshal([]byte(data), &providerChunk); err != nil {
					continue
				}

				// Transform using same response template
				var responseBody bytes.Buffer
				if err := responseTmpl.Execute(&responseBody, providerChunk); err != nil {
					continue
				}

				// Parse the transformed chunk into canonical Response format
				var response dto.Response
				if err := json.Unmarshal(responseBody.Bytes(), &response); err != nil {
					continue
				}

				fmt.Println(response)

				// Send the response chunk
				select {
				case responseChan <- &response:
				case <-ctx.Done():
					return
				}
			}
		}

		if err := scanner.Err(); err != nil {
		}
	}()

	return responseChan, nil
}
