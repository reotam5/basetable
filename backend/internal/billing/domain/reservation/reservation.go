package reservation

import (
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/shared/identity"
)

type ID = identity.ID[Reservation]

var (
	NewID     = identity.NewID[Reservation]
	HydrateID = identity.HydrateID[Reservation]
)

type Reservation struct {
	id        ID
	accountID account.ID
	userID    string
	amount    account.Amount
	status    Status
	createdAt time.Time
	updatedAt time.Time
}

func New(
	accountID account.ID,
	userID string,
	amount account.Amount,
) *Reservation {
	now := time.Now()
	return &Reservation{
		id:        NewID(),
		accountID: accountID,
		userID:    userID,
		amount:    amount,
		status:    StatusPending,
		createdAt: now,
		updatedAt: now,
	}
}

func Hydrate(
	id string,
	accountID string,
	userID string,
	amount int64,
	status string,
	createdAt time.Time,
	updatedAt time.Time,
) *Reservation {
	return &Reservation{
		id:        HydrateID(id),
		accountID: account.HydrateID(accountID),
		userID:    userID,
		amount:    account.HydrateAmount(amount),
		status:    Status{status},
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func (cr *Reservation) ID() ID {
	return cr.id
}

func (cr *Reservation) AccountID() account.ID {
	return cr.accountID
}

func (cr *Reservation) UserID() string {
	return cr.userID
}

func (cr *Reservation) Amount() account.Amount {
	return cr.amount
}

func (cr *Reservation) Status() Status {
	return cr.status
}

func (cr *Reservation) CreatedAt() time.Time {
	return cr.createdAt
}

func (cr *Reservation) UpdatedAt() time.Time {
	return cr.updatedAt
}

func (cr *Reservation) EnsurePending() error {
	if !cr.status.IsPending() {
		return NewAlreadyFinalizedError(cr.id.String(), cr.status.String())
	}
	return nil
}

func (cr *Reservation) IsPending() bool {
	return cr.status.IsPending()
}

func (cr *Reservation) IsCommitted() bool {
	return cr.status.IsCommitted()
}

func (cr *Reservation) IsReleased() bool {
	return cr.status.IsReleased()
}

func (cr *Reservation) IsFinal() bool {
	return cr.status.IsFinal()
}

func (cr *Reservation) Commit(actualAmount account.Amount) error {
	if cr.status.IsFinal() {
		return NewAlreadyFinalizedError(cr.id.String(), cr.status.String())
	}

	cr.amount = actualAmount
	cr.status = StatusCommited
	cr.updatedAt = time.Now()
	return nil
}

func (cr *Reservation) Release() error {
	if cr.status.IsFinal() {
		return NewAlreadyFinalizedError(cr.id.String(), cr.status.String())
	}

	cr.status = StatusReleased
	cr.updatedAt = time.Now()
	return nil
}
