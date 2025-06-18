package auth0

import (
	"net/http"
	"os"
	"strings"
)

func OnSignUpMiddleware() func(http.Handler) http.Handler {
	webhookSecret := os.Getenv("AUTH0_WEBHOOK_SECRET")
	if webhookSecret == "" {
		panic("AUTH0_WEBHOOK_SECRET environment variable must be set")
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			if r.Header.Get("Content-Type") != "application/json" {
				http.Error(w, "Content-Type must be application/json", http.StatusBadRequest)
				return
			}

			// Validate webhook secret
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				http.Error(w, "Missing Authorization header", http.StatusUnauthorized)
				return
			}

			parts := strings.Split(authHeader, " ")
			if len(parts) != 2 || parts[0] != "Bearer" {
				http.Error(w, "Invalid Authorization header format", http.StatusUnauthorized)
				return
			}

			token := parts[1]
			if token != webhookSecret {
				http.Error(w, "Invalid Authorization header", http.StatusUnauthorized)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}
