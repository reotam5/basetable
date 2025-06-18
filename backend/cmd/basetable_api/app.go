package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"gorm.io/driver/postgres"
	gormsdk "gorm.io/gorm"

	"github.com/basetable/basetable/backend/internal/billing/api/controller"
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/application/service"
	gmodel "github.com/basetable/basetable/backend/internal/billing/storage/gorm/model"
	grepo "github.com/basetable/basetable/backend/internal/billing/storage/gorm/repository"

	paymentapi "github.com/basetable/basetable/backend/internal/payment/api"
	paymentapp "github.com/basetable/basetable/backend/internal/payment/application"
	"github.com/basetable/basetable/backend/internal/payment/domain"
	"github.com/basetable/basetable/backend/internal/payment/gateway/stripe"
	"github.com/basetable/basetable/backend/internal/payment/storage/gorm"

	proxyapi "github.com/basetable/basetable/backend/internal/proxy/api/controller"
	proxyapp "github.com/basetable/basetable/backend/internal/proxy/application/repository"
	proxyservice "github.com/basetable/basetable/backend/internal/proxy/application/service"
	proxyclient "github.com/basetable/basetable/backend/internal/proxy/client"
	proxygmodel "github.com/basetable/basetable/backend/internal/proxy/storage/gorm/model"
	proxygrepo "github.com/basetable/basetable/backend/internal/proxy/storage/gorm/repository"

	"github.com/basetable/basetable/backend/internal/shared/application/eventbus"
	"github.com/basetable/basetable/backend/internal/shared/application/unitofwork"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/auth0"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/chi"
	ebImpl "github.com/basetable/basetable/backend/internal/shared/infrastructure/eventbus"
	guow "github.com/basetable/basetable/backend/internal/shared/infrastructure/gorm/unitofwork"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/httpserver"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/zap"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

func Run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Build infrastructure
	logger := buildLogger()
	db := setupDatabase(logger)
	httpServer := setupHTTPServer(logger)
	paymentGateway := setupPaymentGateway(logger)
	eventBus := setupEventBus(ctx, logger)

	// Build application layer
	repositories := setupRepositories(db)
	services := setupServices(repositories, paymentGateway, eventBus)
	controllers := setupControllers(services, logger)

	// Wire everything together
	setupEventSubscriptions(eventBus, services)
	setupRoutes(httpServer, controllers)

	// Start the server
	startHTTPServer(ctx, httpServer, logger)
}

func buildLogger() log.Logger {
	return zap.NewLogger(zap.Config{
		ServiceName: os.Getenv("SERVICE_NAME"),
		ServiceID:   os.Getenv("SERVICE_ID"),
		LogLevel:    zap.LogLevelFromString(os.Getenv("LOG_LEVEL")),
		LogFileName: os.Getenv("LOG_FILE_NAME"),
	})
}

func setupDatabase(logger log.Logger) *gormsdk.DB {
	dsn := fmt.Sprintf(
		"host=%s user=%s password=%s dbname=%s port=%s sslmode=require TimeZone=UTC",
		os.Getenv("DB_HOST"),
		os.Getenv("DB_USER"),
		os.Getenv("DB_PASS"),
		os.Getenv("DB_NAME"),
		os.Getenv("DB_PORT"),
	)

	db, err := gormsdk.Open(postgres.Open(dsn), &gormsdk.Config{})
	if err != nil {
		logger.Fatalf("Failed to connect to database: %v", err)
	}

	runMigrations(db, logger)
	return db
}

func runMigrations(db *gormsdk.DB, logger log.Logger) {
	models := []any{
		&gorm.PaymentModel{},
		&gmodel.LedgerEntryModel{},
		&gmodel.AccountModel{},
		&gmodel.ReservationModel{},
		&proxygmodel.ProviderModel{},
		&proxygmodel.ModelModel{},
		&proxygmodel.EndpointModel{},
	}

	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			logger.Fatalf("Failed to migrate database: %v", err)
		}
	}
}

func setupHTTPServer(logger log.Logger) *httpserver.Server {
	return httpserver.New(
		chi.NewRouter(logger),
		logger,
	)
}

func setupPaymentGateway(logger log.Logger) paymentapp.PaymentGateway {
	stripeGateway, err := stripe.NewGateway(stripe.Config{
		SecretKey:  os.Getenv("STRIPE_SECRET_KEY"),
		SuccessURL: os.Getenv("STRIPE_SUCCESS_URL"),
		CancelURL:  os.Getenv("STRIPE_CANCEL_URL"),
	})
	if err != nil {
		logger.Fatalf("Failed to create Stripe gateway: %v", err)
	}
	return stripeGateway
}

func setupEventBus(ctx context.Context, logger log.Logger) eventbus.EventBus {
	return ebImpl.NewInMemoryBus(ctx, ebImpl.InMemoryBusConfig{Logger: logger})
}

type Repositories struct {
	Payment            paymentapp.PaymentRepository
	Ledger             repository.LedgerRepository
	Account            repository.AccountRepository
	Reservation        repository.ReservationRepository
	BillingUnitOfWork  unitofwork.UnitOfWork[repository.RepositoryProvider]
	Provider           proxyapp.ProviderRepository
	ProviderUnitOfWork unitofwork.UnitOfWork[proxyapp.RepositoryProvider]
}

func setupRepositories(db *gormsdk.DB) *Repositories {
	return &Repositories{
		Payment:            gorm.NewPaymentRepository(db),
		Ledger:             grepo.NewLedgerRepository(db),
		Account:            grepo.NewAccountRepository(db),
		Reservation:        grepo.NewReservationRepository(db),
		BillingUnitOfWork:  guow.NewUnitOfWork(db, grepo.NewRepositoryProvider),
		Provider:           proxygrepo.NewProviderRepository(db),
		ProviderUnitOfWork: guow.NewUnitOfWork(db, proxygrepo.NewRepositoryProvider),
	}
}

type Services struct {
	Payment  paymentapp.PaymentService
	Account  service.AccountService
	Billing  service.BillingService
	Ledger   service.LedgerService
	Provider proxyservice.ProviderService
	Proxy    proxyservice.ProxyService
}

func setupServices(
	repo *Repositories,
	paymentGateway paymentapp.PaymentGateway,
	eventBus eventbus.EventBus,
) *Services {
	paymentService := paymentapp.NewPaymentService(
		paymentGateway,
		repo.Payment,
		eventBus,
	)

	accountService := service.NewAccountService(repo.Account)
	billingService := service.NewBillingService(repo.BillingUnitOfWork)
	ledgerService := service.NewLedgerService(repo.Ledger)

	// Create HTTP client for proxy requests
	proxyClient := proxyclient.NewDefaultHTTPProxyClient()

	providerService := proxyservice.NewProviderService(repo.Provider, repo.ProviderUnitOfWork)
	proxyService := proxyservice.NewProxyService(providerService, proxyClient)

	return &Services{
		Payment:  paymentService,
		Account:  accountService,
		Billing:  billingService,
		Ledger:   ledgerService,
		Provider: providerService,
		Proxy:    proxyService,
	}
}

type Controllers struct {
	Payment  paymentapi.PaymentController
	Account  controller.AccountController
	Provider proxyapi.ProviderController
	Proxy    proxyapi.ProxyController
}

func setupControllers(services *Services, logger log.Logger) *Controllers {
	paymentController := paymentapi.NewPaymentController(services.Payment, logger)
	accountController := controller.NewAccountController(services.Account, logger)
	providerController := proxyapi.NewProviderController(services.Provider)
	proxyController := proxyapi.NewProxyController(services.Proxy)

	return &Controllers{
		Payment:  paymentController,
		Account:  accountController,
		Provider: providerController,
		Proxy:    proxyController,
	}
}

func setupEventSubscriptions(evenBus eventbus.EventBus, service *Services) {
	evenBus.Subscribe(domain.PaymentCompletedEvent, service.Billing.HandlePaymentCompleted)
}

func setupRoutes(httpServer *httpserver.Server, controllers *Controllers) {
	router := httpServer.Router()

	// Health and monitoring endpoints
	router.Route("/health", func(router httpserver.Router) {
		// Health check
		router.Get("/", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})

		// Readiness check
		router.Get("/ready", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("Ready"))
		})
	})

	// Public API endpoints
	router.Route("/v1", func(router httpserver.Router) {
		// Apply Auth0 middleware to all user-facing API routes
		router.Use(auth0.Middleware())

		// Payment routes
		router.Route("/payments", func(router httpserver.Router) {
			router.Post("/", controllers.Payment.CreatePayment)
			//router.Get("/{payment_id}", http.HandlerFunc(controllers.Payment.GetPayment))
		})

		// Credit routes
		router.Route("/account", func(router httpserver.Router) {
			router.Get("/", controllers.Account.GetAccount)
		})

		// Proxy routes
		router.Route("/proxy", func(router httpserver.Router) {
			router.Post("/request", controllers.Proxy.ProxyRequest)
		})

	})

	// We'll move this into admin API later
	// Provider management routes
	router.Route("/v1/providers", func(router httpserver.Router) {
		router.Post("/", controllers.Provider.CreateProvider)
		router.Get("/", controllers.Provider.ListProviders)
		router.Get("/{providerID}", controllers.Provider.GetProvider)
		router.Delete("/{providerID}", controllers.Provider.RemoveProvider)

		// Model management
		router.Post("/{providerID}/models", controllers.Provider.AddModels)
		router.Delete("/{providerID}/models/{modelID}", controllers.Provider.RemoveModel)

		// Endpoint management
		router.Post("/{providerID}/endpoints", controllers.Provider.AddEndpoints)
		router.Delete("/{providerID}/endpoints/{endpointURL}", controllers.Provider.RemoveEndpoint)
		router.Post("/{providerID}/endpoints/activate", controllers.Provider.ActivateEndpoint)
		router.Post("/{providerID}/endpoints/deactivate", controllers.Provider.DeactivateEndpoint)
	})

	// Webhook routes (Stripe, Auth0, etc.)
	router.Route("/webhook", func(router httpserver.Router) {
		// Stripe webhook route
		router.With(stripe.WebhookMiddleware()).Post("/stripe", controllers.Payment.UpdatePaymentStatus)

		// Auth0 webhook route
		router.With(auth0.OnSignUpMiddleware()).Post("/auth0/onsignup", controllers.Account.CreateAccount)
		// router.Post("/auth0/onsignup", func(w http.ResponseWriter, r *http.Request) {
		// 	fmt.Println("HIIII")
		// })
	})

	// Admin API endpoints
	router.Route("/admin/api/v1", func(router httpserver.Router) {
		router.Use(auth0.Middleware())
	})
}

func startHTTPServer(ctx context.Context, httpServer *httpserver.Server, logger log.Logger) {
	host := os.Getenv("HOST")
	if host == "" {
		host = "localhost"
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	address := fmt.Sprintf("%s:%s", host, port)
	go func() {
		if err := httpServer.Start(address); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	gracefulShutdownHTTPServer(ctx, httpServer, logger)
}

func gracefulShutdownHTTPServer(ctx context.Context, httpServer *httpserver.Server, logger log.Logger) {
	logger.Infof("Shutting down server...")
	shutdownCtx, shutdownCancel := context.WithTimeout(ctx, 30*time.Second)
	defer shutdownCancel()

	if err := httpServer.Shutdown(shutdownCtx); err != nil {
		logger.Errorf("Server forced to shutdown: %v", err)
	}

	logger.Infof("Server exited")
}
