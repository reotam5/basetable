package service

import (
	"context"
	"io"
	"time"
)

type ProxyRequest struct {
	Target  string
	Method  string
	Headers map[string]string
	Body    []byte
}

type ProxyResponse struct {
	StatusCode int
	Body       []byte
	Latency    time.Duration
}

type ProxyClient interface {
	ProxyRequest(ctx context.Context, request ProxyRequest) (ProxyResponse, error)
	ProxyRequestStream(ctx context.Context, request ProxyRequest) (io.ReadCloser, error)
}
