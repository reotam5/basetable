package httpserver

import (
	"context"
	"net/http"

	"github.com/basetable/basetable/backend/shared/application/log"
	"github.com/go-chi/chi"
)

type HTTPServer struct {
	serv   *http.Server
	router *chi.Mux
	logger log.Logger
}

func NewHTTPServer(logger log.Logger) *HTTPServer {
	return &HTTPServer{
		serv:   &http.Server{},
		router: chi.NewRouter(),
		logger: logger,
	}
}

func (s *HTTPServer) RegisterRoute(method, path string, handler http.Handler) {
	s.router.Method(method, path, handler)
	s.logger.Infof("Registered route: %s %s", method, path)
}

func (s *HTTPServer) RegisterMiddleware(middleware func(http.Handler) http.Handler) {
	s.router.Use(middleware)
	s.logger.Infof("Registered middleware: %T", middleware)
}

func (s *HTTPServer) Start(addr string) error {
	s.serv.Addr = addr
	s.serv.Handler = s.router

	s.logger.Infof("Starting HTTP server on %s", addr)
	return s.serv.ListenAndServe()
}

func (s *HTTPServer) Shutdown(ctx context.Context) error {
	s.logger.Infof("Shutting down HTTP server")
	return s.serv.Shutdown(ctx)
}

func (s *HTTPServer) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}
