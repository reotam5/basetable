package api

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strings"

	app "github.com/basetable/basetable/backend/internal/payment/application"
	"github.com/basetable/basetable/backend/internal/payment/domain"
	authctx "github.com/basetable/basetable/backend/internal/shared/api/authcontext"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

type PaymentController interface {
	CreatePayment(w http.ResponseWriter, r *http.Request)
	UpdatePaymentStatus(w http.ResponseWriter, r *http.Request)
}

type paymentController struct {
	paymentService app.PaymentService
	logger         log.Logger
}

func NewPaymentController(paymentService app.PaymentService, logger log.Logger) PaymentController {
	return &paymentController{
		paymentService: paymentService,
		logger:         logger,
	}
}

func (c *paymentController) CreatePayment(w http.ResponseWriter, r *http.Request) {
	accountID := authctx.GetAccountID(r.Context())
	var req CreatePaymentRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Errorf("failed to decode request %v", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	validateRequest := func() error {
		if req.Amount <= 0 {
			return fmt.Errorf("topup_amount must be positive")
		}

		if strings.TrimSpace(req.Currency) == "" {
			return fmt.Errorf("currency is required")
		}

		return nil
	}

	// Validate request
	if err := validateRequest(); err != nil {
		c.logger.Warnf("Validation failed for topup payment request for account %s: %v", accountID, err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	// Call application service
	responseDTO, err := c.paymentService.CreatePayment(r.Context(), app.CreatePaymentRequest{
		AccountID: accountID,
		Amount:    req.Amount,
		Currency:  req.Currency,
	})
	if err != nil {
		c.logger.Errorf("Failed to create payment %v", err)
		hutil.WriteJSONErrorResponse(w, r, c.mapDomainErrorToHTTP(err))
		return
	}

	c.logger.Infof("Payment created successfully: payment_id=%s, external_id=%s, external_url=%s, amount=%f, currency=%s",
		responseDTO.PaymentID,
		responseDTO.ExternalID,
		responseDTO.ExternalURL,
		responseDTO.Amount,
		responseDTO.Currency)

	hutil.WriteJSONResponseWithStatus(w, r, http.StatusCreated, CreatePaymentResponse{
		PaymentID:   responseDTO.PaymentID,
		ExternalID:  responseDTO.ExternalID,
		ExternalURL: responseDTO.ExternalURL,
		Amount:      responseDTO.Amount,
		Currency:    responseDTO.Currency,
		CreatedAt:   responseDTO.CreatedAt,
	})
}

func (c *paymentController) UpdatePaymentStatus(w http.ResponseWriter, r *http.Request) {
	var req UpdatePaymentStatusRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		c.logger.Errorf("failed to decode request %e", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	validateRequest := func() error {
		if strings.TrimSpace(req.PaymentID) == "" {
			return fmt.Errorf("payment_id is required")
		}

		if strings.TrimSpace(req.Status) == "" {
			return fmt.Errorf("status is required")
		}

		return nil
	}

	if err := validateRequest(); err != nil {
		c.logger.Warnf("Validation failed for update payment status request: %v", err)
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	responseDTO, err := c.paymentService.UpdatePaymentStatus(r.Context(), app.UpdatePaymentStatusRequest{
		PaymentID: req.PaymentID,
		Status:    req.Status,
	})

	if err != nil {
		c.logger.Errorf("Failed to update payment status", err)
		hutil.WriteJSONErrorResponse(w, r, c.mapDomainErrorToHTTP(err))
		return
	}

	if responseDTO == nil {
		// Payment already finalized, for now just log and ignore. We will not return an error which would trigger Stripe to retry
		c.logger.Infof("Payment already finalized")
		return
	}

	c.logger.Infof("Payment status updated successfully: payment_id=%s, account_id=%s, external_id=%s, status=%s, updated_at=%s",
		responseDTO.PaymentID,
		responseDTO.AccountID,
		responseDTO.ExternalID,
		responseDTO.Status,
		responseDTO.UpdatedAt,
	)

	hutil.WriteJSONResponseWithStatus(w, r, http.StatusOK, UpdatePaymentStatusResponse{
		PaymentID:  responseDTO.PaymentID,
		ExternalID: responseDTO.ExternalID,
		Status:     responseDTO.Status,
		UpdatedAt:  responseDTO.UpdatedAt,
	})

}

func (c *paymentController) mapDomainErrorToHTTP(err error) *hutil.HTTPError {
	// We will map application errors to HTTP errors later, for now just bubble domain errors up and hide internal error messages
	if paymentErr, ok := err.(*domain.PaymentError); ok {
		switch paymentErr.ErrorType() {
		case domain.PaymentErrorTypeInvalidAmountValue:
			return hutil.NewBadRequestError(paymentErr)
		case domain.PaymentErrorTypeInvalidCurrency:
			return hutil.NewBadRequestError(paymentErr)
		case domain.PaymentErrorTypeSessionAlreadyFinalized:
			return hutil.NewConflictError(paymentErr)
		}
	}

	return hutil.NewInternalError(err)
}
