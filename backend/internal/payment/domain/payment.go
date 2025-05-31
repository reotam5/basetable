package domain

import (
	"fmt"
	"time"

	"github.com/basetable/basetable/backend/internal/shared/identity"
)

type ID = identity.ID[Payment]

var (
	NewID     = identity.NewID[Payment]
	HydrateID = identity.HydrateID[Payment]
)

type Payment struct {
	id          ID
	userID      string
	amount      Amount
	status      PaymentStatus
	externalID  string
	externalURL string
	createdAt   time.Time
	updatedAt   time.Time
}

// NewPaymentSession creates a new payment session for initial creation
func NewPayment(
	userID string,
	amount Amount,
) *Payment {
	now := time.Now()
	return &Payment{
		id:        NewID(),
		userID:    userID,
		amount:    amount,
		status:    PaymentStatusPending,
		createdAt: now,
		updatedAt: now,
	}
}

// RehydratePayment reconstructs a payment session
func RehydratePayment(
	id string,
	userID string,
	amountValue int64,
	amountCurrency string,
	paymentStatus string,
	externalID string,
	externalURL string,
	createdAt time.Time,
	updatedAt time.Time,
) *Payment {

	return &Payment{
		id:     HydrateID(id),
		userID: userID,
		amount: Amount{
			value:    amountValue,
			currency: Currency{amountCurrency},
		},
		status:      PaymentStatus{paymentStatus},
		externalID:  externalID,
		externalURL: externalURL,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
	}
}

func (p *Payment) ID() ID {
	return p.id
}

func (p *Payment) UserID() string {
	return p.userID
}

func (p *Payment) Amount() Amount {
	return p.amount
}

func (p *Payment) PaymentStatus() PaymentStatus {
	return p.status
}

func (p *Payment) ExternalID() string {
	return p.externalID
}

func (p *Payment) ExternalURL() string {
	return p.externalURL
}

func (p *Payment) CreatedAt() time.Time {
	return p.createdAt
}

func (p *Payment) UpdatedAt() time.Time {
	return p.updatedAt
}

func (p *Payment) AttachExternalReference(externalID, externalURL string) error {
	if p.status.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.status)
	}
	p.externalID = externalID
	p.externalURL = externalURL
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsCompleted() error {
	if p.status.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.status)
	}
	p.status = PaymentStatusCompleted
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsFailed() error {
	if p.status.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.status)
	}
	p.status = PaymentStatusFailed
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsCancelled() error {
	if p.status.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.status)
	}
	p.status = PaymentStatusCancelled
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) IsFinalized() bool {
	return p.status.IsFinal()
}

func (p *Payment) IsPending() bool {
	return p.status.IsPending()
}

func (p *Payment) IsCompleted() bool {
	return p.status.IsCompleted()
}

func (p *Payment) IsFailed() bool {
	return p.status.IsFailed()
}

func (p *Payment) IsCancelled() bool {
	return p.status.IsCancelled()
}

func (p *Payment) String() string {
	return fmt.Sprintf(
		"PaymentSession(ID: %s, UserID: %s, Amount: %s, Status: %s, ExternalID: %s, ExternalURL: %s, CreatedAt: %s, UpdatedAt: %s)",
		p.id,
		p.userID,
		p.amount.String(),
		p.status.String(),
		p.externalID,
		p.externalURL,
		p.createdAt.Format(time.RFC3339),
		p.updatedAt.Format(time.RFC3339),
	)
}
