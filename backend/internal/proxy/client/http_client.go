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
	regularClient   *http.Client // For regular API calls with shorter timeout
	streamingClient *http.Client // For streaming requests with longer timeout
}

// NewHTTPProxyClient creates a new HTTP proxy client with configurable timeout and connection pooling
func NewHTTPProxyClient(timeout time.Duration) service.ProxyClient {
	transport := &http.Transport{
		MaxIdleConns:        100,
		MaxIdleConnsPerHost: 25,
		MaxConnsPerHost:     50,
		IdleConnTimeout:     90 * time.Second,
		TLSHandshakeTimeout: 10 * time.Second,
		DisableCompression:  true, // Disable compression to avoid buffering for streaming
	}

	return &HTTPProxyClient{
		regularClient: &http.Client{
			Timeout:   timeout,
			Transport: transport,
		},
		streamingClient: &http.Client{
			Timeout:   600 * time.Second, // Longer timeout for streaming
			Transport: transport,
		},
	}
}

// NewDefaultHTTPProxyClient creates a new HTTP proxy client with default 90 second timeout
func NewDefaultHTTPProxyClient() service.ProxyClient {
	return NewHTTPProxyClient(60 * time.Second)
}

// ProxyRequest implements the ProxyClient interface
func (c *HTTPProxyClient) ProxyRequest(ctx context.Context, request service.ProxyRequest) (service.ProxyResponse, error) {
	startTime := time.Now()
	req, err := http.NewRequestWithContext(ctx, request.Method, request.Target, bytes.NewReader(request.Body))
	if err != nil {
		return service.ProxyResponse{}, err
	}

	for key, value := range request.Headers {
		req.Header.Set(key, value)
	}

	resp, err := c.regularClient.Do(req)
	if err != nil {
		return service.ProxyResponse{}, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return service.ProxyResponse{}, err
	}

	latency := time.Since(startTime)

	return service.ProxyResponse{
		StatusCode: resp.StatusCode,
		Body:       body,
		Latency:    latency,
	}, nil
}

// ProxyRequestStream implements the ProxyClient interface for streaming requests
func (c *HTTPProxyClient) ProxyRequestStream(ctx context.Context, request service.ProxyRequest) (io.ReadCloser, error) {
	req, err := http.NewRequestWithContext(ctx, request.Method, request.Target, bytes.NewReader(request.Body))
	if err != nil {
		return nil, err
	}

	// Set headers
	for key, value := range request.Headers {
		req.Header.Set(key, value)
	}

	resp, err := c.streamingClient.Do(req)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode >= 400 {
		b, _ := io.ReadAll(resp.Body)
		fmt.Println(string(b))
		resp.Body.Close()
		return nil, fmt.Errorf("HTTP error: %d", resp.StatusCode)
	}

	return resp.Body, nil
}
