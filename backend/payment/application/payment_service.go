package application

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/payment/domain"
	event "github.com/basetable/basetable/backend/shared/application/eventbus"
)

type PaymentService interface {
	CreatePayment(ctx context.Context, request CreatePaymentRequest) (*CreatePaymentResponse, error)
	UpdatePaymentStatus(ctx context.Context, request UpdatePaymentStatusRequest) (*UpdatePaymentStatusResponse, error)
}

type paymentService struct {
	paymentGateway    PaymentGateway
	paymentRepository PaymentRepository
	eventBus          event.EventBus
}

var _ PaymentService = (*paymentService)(nil)

func NewPaymentService(
	paymentGateway PaymentGateway,
	paymentRepository PaymentRepository,
	eventBus event.EventBus,
) PaymentService {
	return &paymentService{
		paymentGateway:    paymentGateway,
		paymentRepository: paymentRepository,
		eventBus:          eventBus,
	}
}

func (p *paymentService) CreatePayment(ctx context.Context, request CreatePaymentRequest) (*CreatePaymentResponse, error) {
	currency, err := domain.NewCurrencyFromString(request.Currency)
	if err != nil {
		return nil, err
	}

	amount, err := domain.NewAmount(request.Amount, currency)
	if err != nil {
		return nil, err
	}

	payment := domain.NewPayment(request.UserID, amount)
	checkout, err := p.paymentGateway.InitiateCheckoutSession(ctx, InitiateCheckoutSessionRequest{
		PaymentID: payment.ID().String(),
		UserID:    request.UserID,
		Amount:    payment.Amount(),
	})
	if err != nil {
		return nil, err
	}
	_ = payment.AttachExternalReference(checkout.SessionID, checkout.SessionURL)
	if err = p.paymentRepository.Save(ctx, payment); err != nil {
		// just attempt payment again and let the checkout session expire
		return nil, err
	}

	return &CreatePaymentResponse{
		PaymentID:     payment.ID().String(),
		ExternalID:    payment.ExternalID(),
		ExternalURL:   payment.ExternalURL(),
		Amount:        payment.Amount().Value(),
		Currency:      payment.Amount().Currency().String(),
		PaymentStatus: payment.PaymentStatus().String(),
		CreatedAt:     payment.CreatedAt().Format(time.RFC3339),
	}, nil
}

// Stripe middleware will call this method when it receives an event from Stripe via webhook to update payment status
// If this method fails, the middleware will return an HTTP error so Stripe could schedule a retry
func (p *paymentService) UpdatePaymentStatus(ctx context.Context, request UpdatePaymentStatusRequest) (resp *UpdatePaymentStatusResponse, err error) {
	payment, err := p.paymentRepository.GetByID(ctx, request.PaymentID)
	if err != nil {
		return nil, err
	}

	newStatus, err := domain.NewPaymentStatusFromString(request.Status)
	if err != nil {
		return nil, err
	}

	switch newStatus {
	case domain.PaymentStatusCompleted:
		err = payment.MarkAsCompleted()

	case domain.PaymentStatusFailed:
		err = payment.MarkAsFailed()

	case domain.PaymentStatusCancelled:
		err = payment.MarkAsCancelled()
	}

	// if payment is already finalized, we won't process it again. for now just ignore it
	if err != nil {
		return nil, nil
	}

	if err := p.paymentRepository.Save(ctx, payment); err != nil {
		// just return here so we could retry later
		return nil, err
	}

	// If we make past this point and the payment goes through, we're set
	// Notify Credit Account Service to update the balance asynchronously
	// If this operation fails after multiple retries, we send it to a DLQ to investigate
	if payment.PaymentStatus().IsCompleted() {
		event := event.NewEvent(
			event.EventType(domain.PaymentStatusCompleted.String()),
			payment.ID().String(),
		)
		p.eventBus.PublishAsync(event)
	}

	resp = &UpdatePaymentStatusResponse{
		PaymentID:  payment.ID().String(),
		ExternalID: payment.ExternalID(),
		Status:     payment.PaymentStatus().String(),
		UpdatedAt:  payment.UpdatedAt().Format(time.RFC3339),
	}

	return resp, nil
}
