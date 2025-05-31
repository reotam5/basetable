package domain

import (
	"fmt"
	"time"

	id "github.com/basetable/basetable/backend/shared/identity"
)

type PaymentID struct {
	value string
}

func NewPaymentID() PaymentID {
	return PaymentID{value: id.GenerateID()}
}

func (pid PaymentID) String() string {
	return pid.value
}

type Payment struct {
	id            PaymentID
	userID        string
	amount        Amount
	paymentStatus PaymentStatus
	externalID    string
	externalURL   string
	createdAt     time.Time
	updatedAt     time.Time
}

// NewPaymentSession creates a new payment session for initial creation
func NewPayment(
	userID string,
	amount Amount,
) *Payment {
	return &Payment{
		id:            NewPaymentID(),
		userID:        userID,
		amount:        amount,
		paymentStatus: PaymentStatusPending,
		createdAt:     time.Now(),
		updatedAt:     time.Now(),
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
		id:     PaymentID{value: id},
		userID: userID,
		amount: Amount{
			value:    amountValue,
			currency: Currency{amountCurrency},
		},
		paymentStatus: PaymentStatus{
			value: paymentStatus,
		},
		externalID:  externalID,
		externalURL: externalURL,
		createdAt:   createdAt,
		updatedAt:   updatedAt,
	}
}

func (p *Payment) ID() PaymentID {
	return p.id
}

func (p *Payment) UserID() string {
	return p.userID
}

func (p *Payment) Amount() Amount {
	return p.amount
}

func (p *Payment) PaymentStatus() PaymentStatus {
	return p.paymentStatus
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
	if p.paymentStatus.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.paymentStatus)
	}
	p.externalID = externalID
	p.externalURL = externalURL
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsCompleted() error {
	if p.paymentStatus.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.paymentStatus)
	}
	p.paymentStatus = PaymentStatusCompleted
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsFailed() error {
	if p.paymentStatus.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.paymentStatus)
	}
	p.paymentStatus = PaymentStatusFailed
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) MarkAsCancelled() error {
	if p.paymentStatus.IsFinal() {
		return NewPaymentAlreadyFinalizedError(p.id.String(), p.paymentStatus)
	}
	p.paymentStatus = PaymentStatusCancelled
	p.updatedAt = time.Now()
	return nil
}

func (p *Payment) IsFinalized() bool {
	return p.paymentStatus.IsFinal()
}

func (p *Payment) IsPending() bool {
	return p.paymentStatus.IsPending()
}

func (p *Payment) IsCompleted() bool {
	return p.paymentStatus.IsCompleted()
}

func (p *Payment) IsFailed() bool {
	return p.paymentStatus.IsFailed()
}

func (p *Payment) IsCancelled() bool {
	return p.paymentStatus.IsCancelled()
}

func (p *Payment) String() string {
	return fmt.Sprintf(
		"PaymentSession(ID: %s, UserID: %s, Amount: %s, Status: %s, ExternalID: %s, ExternalURL: %s, CreatedAt: %s, UpdatedAt: %s)",
		p.id,
		p.userID,
		p.amount.String(),
		p.paymentStatus.String(),
		p.externalID,
		p.externalURL,
		p.createdAt.Format(time.RFC3339),
		p.updatedAt.Format(time.RFC3339),
	)
}
