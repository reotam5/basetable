package chi

import (
	"net/http"

	"github.com/go-chi/chi"

	"github.com/basetable/basetable/backend/internal/shared/infrastructure/httpserver"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

type ChiRouter struct {
	mux    chi.Router
	logger log.Logger
}

func NewChiRouter(logger log.Logger) *ChiRouter {
	return &ChiRouter{
		mux:    chi.NewRouter(),
		logger: logger,
	}
}

func (r *ChiRouter) Get(path string, handler http.HandlerFunc) {
	r.mux.Get(path, handler)
	r.logger.Infof("Registered route: GET %s", path)
}

func (r *ChiRouter) Post(path string, handler http.HandlerFunc) {
	r.mux.Post(path, handler)
	r.logger.Infof("Registered route: POST %s", path)
}

func (r *ChiRouter) Put(path string, handler http.HandlerFunc) {
	r.mux.Put(path, handler)
	r.logger.Infof("Registered route: PUT %s", path)
}

func (r *ChiRouter) Delete(path string, handler http.HandlerFunc) {
	r.mux.Delete(path, handler)
	r.logger.Infof("Registered route: DELETE %s", path)
}

func (r *ChiRouter) Patch(path string, handler http.HandlerFunc) {
	r.mux.Patch(path, handler)
	r.logger.Infof("Registered route: PATCH %s", path)
}

func (r *ChiRouter) Use(middleware httpserver.Middleware) {
	r.mux.Use(middleware)
	r.logger.Infof("Registered middleware: %T", middleware)
}

func (r *ChiRouter) With(middleware httpserver.Middleware) httpserver.Router {
	return &ChiRouter{
		mux:    r.mux.With(middleware),
		logger: r.logger,
	}
}

func (r *ChiRouter) Route(path string, fn func(router httpserver.Router)) {
	r.mux.Route(path, func(cr chi.Router) {
		subRouter := &ChiRouter{
			mux:    cr,
			logger: r.logger,
		}
		fn(subRouter)
	})
	r.logger.Infof("Registered route group: %s", path)
}

func (r *ChiRouter) ServeHTTP(w http.ResponseWriter, req *http.Request) {
	r.mux.ServeHTTP(w, req)
}
