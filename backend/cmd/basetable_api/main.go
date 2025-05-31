package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"gorm.io/driver/postgres"
	gormsdk "gorm.io/gorm"

	"github.com/basetable/basetable/backend/payment/api"
	"github.com/basetable/basetable/backend/payment/application"
	"github.com/basetable/basetable/backend/payment/gorm"
	"github.com/basetable/basetable/backend/payment/stripe"
	eb "github.com/basetable/basetable/backend/shared/infrastructure/eventbus"
	"github.com/basetable/basetable/backend/shared/infrastructure/httpserver"
	"github.com/basetable/basetable/backend/shared/infrastructure/zap"
)

func init() {
	if err := godotenv.Load(); err != nil {
		panic("Error loading .env file")
	}
}

func main() {
	ctx := context.Background()
	logger := zap.NewZapLogger("basetable_api", "", "api.log")

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

	// Auto-migrate the database schema
	if err := db.AutoMigrate(&gorm.PaymentModel{}); err != nil {
		logger.Fatalf("Failed to migrate database: %v", err)
	}

	// Initialize HTTP server
	httpServer := httpserver.NewHTTPServer(logger)

	// Initialize Stripe gateway
	stripeGateway, err := stripe.NewGateway(stripe.Config{
		SecretKey:  os.Getenv("STRIPE_SECRET_KEY"),
		SuccessURL: "http://localhost:8080/basetable/success",
		CancelURL:  "http://localhost:8080/basetable/cancel",
	})
	if err != nil {
		logger.Fatalf("Failed to create Stripe gateway: %v", err)
	}

	// Initialize repositories and services
	paymentRepository := gorm.NewPaymentRepository(db)
	eventBus := eb.NewInMemoryBus(ctx, eb.InMemoryBusConfig{})

	paymentService := application.NewPaymentService(
		stripeGateway,
		paymentRepository,
		eventBus,
	)

	// Initialize controllers
	paymentController := api.NewPaymentController(paymentService, stripeGateway, logger)

	// Register routes
	httpServer.RegisterRoute("POST", "/api/v1/payments", http.HandlerFunc(paymentController.CreatePayment))
	httpServer.RegisterRoute("POST", "/api/v1/payments/status", stripe.WebhookMiddleware(http.HandlerFunc(paymentController.UpdatePaymentStatus)))

	// Start server in a goroutine
	go func() {
		if err := httpServer.Start(":8080"); err != nil && err != http.ErrServerClosed {
			logger.Fatalf("Failed to start server: %v", err)
		}
	}()

	logger.Infof("Server started on :8080")

	// Wait for interrupt signal to gracefully shutdown the server
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	logger.Infof("Shutting down server...")

	// Give the server 30 seconds to shutdown gracefully
	ctx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	if err := httpServer.Shutdown(ctx); err != nil {
		logger.Errorf("Server forced to shutdown: %v", err)
	}

	logger.Infof("Server exited")
}
