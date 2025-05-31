package stripe

import (
	"context"
	"fmt"
	"strings"

	stripesdk "github.com/stripe/stripe-go/v82"
	session "github.com/stripe/stripe-go/v82/checkout/session"

	app "github.com/basetable/basetable/backend/internal/payment/application"
)

type Gateway struct {
	successURL, cancelURL string
}

type Config struct {
	SecretKey  string
	SuccessURL string
	CancelURL  string
}

func NewGateway(config Config) (*Gateway, error) {
	if config.SecretKey == "" || config.SuccessURL == "" || config.CancelURL == "" {
		return nil, fmt.Errorf("invalid Stripe configuration: missing required fields")
	}

	stripesdk.Key = config.SecretKey
	return &Gateway{
		successURL: config.SuccessURL,
		cancelURL:  config.CancelURL,
	}, nil
}

func (gw *Gateway) InitiateCheckoutSession(ctx context.Context, req app.InitiateCheckoutSessionRequest) (*app.CheckoutSession, error) {
	params := &stripesdk.CheckoutSessionParams{
		Mode: stripesdk.String(string(stripesdk.CheckoutSessionModePayment)),
		LineItems: []*stripesdk.CheckoutSessionLineItemParams{
			{
				PriceData: &stripesdk.CheckoutSessionLineItemPriceDataParams{
					Currency: stripesdk.String(strings.ToLower(req.Amount.Currency().String())),
					ProductData: &stripesdk.CheckoutSessionLineItemPriceDataProductDataParams{
						Name:        stripesdk.String(fmt.Sprintf("%.2f Credits", req.Amount.Dollars())),
						Description: stripesdk.String("Account Credit Top-up"),
					},
					UnitAmount: stripesdk.Int64(req.Amount.Value()),
				},
				Quantity: stripesdk.Int64(1),
			},
		},
		SuccessURL: stripesdk.String(gw.successURL + "?session_id={CHECKOUT_SESSION_ID}"),
		CancelURL:  stripesdk.String(gw.cancelURL),
		Metadata: map[string]string{
			"type":         "credit_topup",
			"topup_amount": fmt.Sprintf("%.2f %s", req.Amount.Dollars(), req.Amount.Currency().String()),
		},
		ClientReferenceID: stripesdk.String(req.PaymentID),
	}

	sess, err := session.New(params)
	if err != nil {
		return nil, fmt.Errorf("failed to create checkout session: %w", err)
	}

	return &app.CheckoutSession{
		SessionID:  sess.ID,
		SessionURL: sess.URL,
	}, nil
}
