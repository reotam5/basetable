package httpserver

import "net/http"

type Router interface {
	http.Handler

	// Routing methods
	Get(path string, handler http.HandlerFunc)
	Post(path string, handler http.HandlerFunc)
	Put(path string, handler http.HandlerFunc)
	Delete(path string, handler http.HandlerFunc)
	Patch(path string, handler http.HandlerFunc)

	// Middleware
	Use(middleware Middleware)
	With(middleware Middleware) Router

	// Grouping
	Route(path string, fn func(router Router))
}
