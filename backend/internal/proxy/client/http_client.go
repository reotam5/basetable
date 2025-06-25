package client

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"time"

	"github.com/basetable/basetable/backend/internal/proxy/application/service"
)

// HTTPProxyClient implements the ProxyClient interface using HTTP requests
type HTTPProxyClient struct {
	httpClient *http.Client
}

// NewHTTPProxyClient creates a new HTTP proxy client with configurable timeout
func NewHTTPProxyClient(timeout time.Duration) service.ProxyClient {
	return &HTTPProxyClient{
		httpClient: &http.Client{
			Timeout: timeout,
			// You can add more configuration here like custom transport, TLS config, etc.
		},
	}
}

// NewDefaultHTTPProxyClient creates a new HTTP proxy client with default 30 second timeout
func NewDefaultHTTPProxyClient() service.ProxyClient {
	return NewHTTPProxyClient(60 * time.Second)
}

// ProxyRequest implements the ProxyClient interface
func (c *HTTPProxyClient) ProxyRequest(ctx context.Context, request service.ProxyRequest) (service.ProxyResponse, error) {
	startTime := time.Now()

	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, request.Method, request.Target, bytes.NewReader(request.Body))
	if err != nil {
		return service.ProxyResponse{}, err
	}

	// Set headers
	for key, value := range request.Headers {
		req.Header.Set(key, value)
	}

	// Make the HTTP request
	resp, err := c.httpClient.Do(req)
	if err != nil {
		return service.ProxyResponse{}, err
	}
	defer resp.Body.Close()

	// Read response body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return service.ProxyResponse{}, err
	}

	// Calculate latency
	latency := time.Since(startTime)

	return service.ProxyResponse{
		StatusCode: resp.StatusCode,
		Body:       body,
		Latency:    latency,
	}, nil
}

// ProxyRequestStream implements the ProxyClient interface for streaming requests
func (c *HTTPProxyClient) ProxyRequestStream(ctx context.Context, request service.ProxyRequest) (io.ReadCloser, error) {
	// Create HTTP request
	req, err := http.NewRequestWithContext(ctx, request.Method, request.Target, bytes.NewReader(request.Body))
	if err != nil {
		return nil, err
	}

	// Set headers
	for key, value := range request.Headers {
		req.Header.Set(key, value)
	}

	// Create a client with custom transport for streaming
	transport := &http.Transport{
		DisableCompression: true, // Disable compression to avoid buffering
	}

	streamClient := &http.Client{
		Timeout:   0, // No timeout for streaming
		Transport: transport,
	}

	// Make the HTTP request
	resp, err := streamClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		fmt.Println(string(b))
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	// Return the response body as a ReadCloser for streaming
	return resp.Body, nil
}
