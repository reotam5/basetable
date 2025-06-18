package stripe

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"

	stripev82 "github.com/stripe/stripe-go/v82"
	"github.com/stripe/stripe-go/v82/webhook"

	"github.com/basetable/basetable/backend/internal/payment/api"
)

func WebhookMiddleware() func(http.Handler) http.Handler {
	endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
	if endpointSecret == "" {
		panic("Missing STRIPE_WEBHOOK_SECRET environment variable")
	}

	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			const MaxBodyBytes = int64(65536)
			r.Body = http.MaxBytesReader(w, r.Body, MaxBodyBytes)
			payload, err := io.ReadAll(r.Body)
			if err != nil {
				fmt.Fprintf(w, "Failed to read request body: %v", err)
				w.WriteHeader(http.StatusServiceUnavailable)
				return
			}

			event := stripev82.Event{}
			if err := json.Unmarshal(payload, &event); err != nil {
				fmt.Fprintf(os.Stderr, "Stripe Webhook failed to parse request: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			endpointSecret := os.Getenv("STRIPE_WEBHOOK_SECRET")
			signatureHeader := r.Header.Get("Stripe-Signature")
			event, err = webhook.ConstructEvent(payload, signatureHeader, endpointSecret)
			if err != nil {
				fmt.Fprintf(os.Stderr, "Stripe Webhook signature verification failed: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			var session stripev82.CheckoutSession
			if err := json.Unmarshal(event.Data.Raw, &session); err != nil {
				fmt.Fprintf(os.Stderr, "Stripe Webhook failed to parse CheckoutSession: %v", err)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			paymentStatus := determinePaymentStatus(event.Type, &session)
			if paymentStatus == "unknown" {
				fmt.Fprintf(os.Stderr, "Stripe Webhook received unknown event type: %s", event.Type)
				w.WriteHeader(http.StatusBadRequest)
				return
			}

			if paymentStatus == "pending" {
				// If the payment is pending, we do not need to update the status
				return
			}

			paymentStatusUpdate := &api.UpdatePaymentStatusRequest{
				PaymentID: session.ClientReferenceID,
				Status:    paymentStatus,
			}

			jsonData, err := json.Marshal(paymentStatusUpdate)
			if err != nil {
				fmt.Fprintf(os.Stderr, "Failed to marshal payment status update: %v", err)
				w.WriteHeader(http.StatusInternalServerError)
				return
			}

			r.Body = io.NopCloser(bytes.NewReader(jsonData))
			r.ContentLength = int64(len(jsonData))
			r.Header.Set("Content-Type", "application/json")
			r.Method = "PUT"
			next.ServeHTTP(w, r)
		})
	}
}

func determinePaymentStatus(eventType stripev82.EventType, session *stripev82.CheckoutSession) string {
	switch eventType {
	case stripev82.EventTypeCheckoutSessionCompleted:
		if session.PaymentStatus != stripev82.CheckoutSessionPaymentStatusUnpaid {
			return "completed"
		}

		return "pending"

	case stripev82.EventTypeCheckoutSessionAsyncPaymentSucceeded:
		return "completed"

	case stripev82.EventTypeCheckoutSessionAsyncPaymentFailed:
		return "failed"

	case stripev82.EventTypeCheckoutSessionExpired:
		return "cancelled"

	default:
		return "unknown"
	}
}
