package httpserver

import "net/http"

type Middleware func(http.Handler) http.Handler
