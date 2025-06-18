package auth0

import (
	"context"
	"net/http"
	"net/url"
	"os"

	jwtmiddleware "github.com/auth0/go-jwt-middleware/v2"
	"github.com/auth0/go-jwt-middleware/v2/jwks"
	"github.com/auth0/go-jwt-middleware/v2/validator"

	"github.com/basetable/basetable/backend/internal/shared/api/authcontext"
)

// CustomClaims represents the custom claims from Auth0 JWT token
type CustomClaims struct {
	AccountID string `json:"account_id"`
}

// Validate is required by the validator interface
func (c CustomClaims) Validate(ctx context.Context) error {
	return nil
}

// Middleware creates and returns an Auth0 JWT middleware
func Middleware() func(http.Handler) http.Handler {
	domain := os.Getenv("AUTH0_DOMAIN")
	audience := os.Getenv("AUTH0_AUDIENCE")

	if domain == "" || audience == "" {
		panic("AUTH0_DOMAIN and AUTH0_AUDIENCE environment variables must be set")
	}

	issuerURL, err := url.Parse("https://" + domain + "/")
	if err != nil {
		panic("Invalid AUTH0_DOMAIN: " + err.Error())
	}

	provider := jwks.NewCachingProvider(issuerURL, 5*60) // 5 minutes cache

	jwtValidator, err := validator.New(
		provider.KeyFunc,
		validator.RS256,
		issuerURL.String(),
		[]string{audience},
		validator.WithCustomClaims(
			func() validator.CustomClaims {
				return &CustomClaims{}
			},
		),
	)
	if err != nil {
		panic("Failed to set up the jwt validator: " + err.Error())
	}

	middleware := jwtmiddleware.New(
		jwtValidator.ValidateToken,
		jwtmiddleware.WithErrorHandler(func(w http.ResponseWriter, r *http.Request, err error) {
			w.Header().Set("Content-Type", "application/json")
			w.WriteHeader(http.StatusUnauthorized)
			w.Write([]byte(`{"error": "Unauthorized", "message": "Invalid or missing token"}`))
		}),
	)

	return func(next http.Handler) http.Handler {
		return middleware.CheckJWT(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Extract claims from the validated token
			token := r.Context().Value(jwtmiddleware.ContextKey{}).(*validator.ValidatedClaims)
			customClaims := token.CustomClaims.(*CustomClaims)

			// Inject account_id into context
			ctx := authcontext.WithAccountID(r.Context(), customClaims.AccountID)
			r = r.WithContext(ctx)

			next.ServeHTTP(w, r)
		}))
	}
}
