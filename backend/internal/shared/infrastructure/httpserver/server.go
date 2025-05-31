package httpserver

import (
	"context"
	"net/http"

	"github.com/basetable/basetable/backend/internal/shared/log"
)

type Server struct {
	serv   *http.Server
	router Router
	logger log.Logger
}

func New(router Router, logger log.Logger) *Server {
	return &Server{
		serv:   &http.Server{},
		router: router,
		logger: logger,
	}
}

func (s *Server) Router() Router {
	return s.router
}

func (s *Server) Start(addr string) error {
	s.serv.Addr = addr
	s.serv.Handler = s.router

	s.logger.Infof("Starting HTTP server on %s", addr)
	return s.serv.ListenAndServe()
}

func (s *Server) Shutdown(ctx context.Context) error {
	s.logger.Infof("Shutting down HTTP server")
	return s.serv.Shutdown(ctx)
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	s.router.ServeHTTP(w, r)
}
