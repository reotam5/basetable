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
	"github.com/basetable/basetable/backend/internal/billing/storage/gorm/unitofwork"

	paymentapi "github.com/basetable/basetable/backend/internal/payment/api"
	paymentapp "github.com/basetable/basetable/backend/internal/payment/application"
	"github.com/basetable/basetable/backend/internal/payment/gateway/stripe"
	"github.com/basetable/basetable/backend/internal/payment/storage/gorm"

	"github.com/basetable/basetable/backend/internal/shared/application/eventbus"
	"github.com/basetable/basetable/backend/internal/shared/application/events"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/chi"
	ebImpl "github.com/basetable/basetable/backend/internal/shared/infrastructure/eventbus"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/httpserver"
	"github.com/basetable/basetable/backend/internal/shared/infrastructure/zap"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

func Run(ctx context.Context) {
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	// Build infrastructure
	logger := builLogger()
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

func builLogger() log.Logger {
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
	}

	for _, model := range models {
		if err := db.AutoMigrate(model); err != nil {
			logger.Fatalf("Failed to migrate database: %v", err)
		}
	}
}

func setupHTTPServer(logger log.Logger) *httpserver.Server {
	return httpserver.New(
		chi.NewChiRouter(logger),
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
	Payment     paymentapp.PaymentRepository
	Ledger      repository.LedgerRepository
	Account     repository.AccountRepository
	Reservation repository.ReservationRepository
	UnitOfWork  service.UnitOfWork
}

func setupRepositories(db *gormsdk.DB) *Repositories {
	return &Repositories{
		Payment:     gorm.NewPaymentRepository(db),
		Ledger:      grepo.NewLedgerRepository(db),
		Account:     grepo.NewAccountRepository(db),
		Reservation: grepo.NewReservationRepository(db),
		UnitOfWork:  unitofwork.NewUnitOfWork(db),
	}
}

type Services struct {
	Payment paymentapp.PaymentService
	Account service.AccountService
	Billing service.BillingService
	Ledger  service.LedgerService
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
	billingService := service.NewBillingService(repo.UnitOfWork)
	ledgerService := service.NewLedgerService(repo.Ledger)

	return &Services{
		Payment: paymentService,
		Account: accountService,
		Billing: billingService,
		Ledger:  ledgerService,
	}
}

type Controllers struct {
	Payment paymentapi.PaymentController
	Account controller.AccountController
}

func setupControllers(services *Services, logger log.Logger) *Controllers {
	paymentController := paymentapi.NewPaymentController(services.Payment, logger)

	accountController := controller.NewAccountController(services.Account, logger)

	return &Controllers{
		Payment: paymentController,
		Account: accountController,
	}
}

func setupEventSubscriptions(evenBus eventbus.EventBus, service *Services) {
	evenBus.Subscribe(events.PaymentCompletedEvent, service.Billing.HandlePaymentCompleted)
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

	// Public API endpointss
	router.Route("/api/v1", func(router httpserver.Router) {
		// Apply Auth0 middleware to all user-facing API routes
		// router.Use(auth0Middleware)

		// Payment routes
		router.Route("/payments", func(router httpserver.Router) {
			router.Post("/", http.HandlerFunc(controllers.Payment.CreatePayment))
			//router.Get("/{payment_id}", http.HandlerFunc(controllers.Payment.GetPayment))
		})

		// Credit routes
		router.Route("/accounts", func(router httpserver.Router) {
			router.Get("/{account_id}", controllers.Account.GetAccount)
		})
	})

	// Webhook routes (Stripe, Auth0, etc.)
	router.Route("/webhook", func(router httpserver.Router) {
		// Stripe webhook route
		router.With(stripe.WebhookMiddleware).Post("/stripe", controllers.Payment.UpdatePaymentStatus)
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
