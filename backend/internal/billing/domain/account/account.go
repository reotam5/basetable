package account

import (
	"fmt"
	"time"

	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type ID = domain.ID[Account]

var (
	NewID     = domain.NewID[Account]
	HydrateID = domain.HydrateID[Account]
)

type Account struct {
	id        ID
	userID    string
	balance   Amount
	createdAt time.Time
	updatedAt time.Time
}

// New creates a new credit account for initial creation
func New(userID string) *Account {
	now := time.Now()
	return &Account{
		id:        NewID(),
		userID:    userID,
		balance:   Amount{0},
		createdAt: now,
		updatedAt: now,
	}
}

// Hydrate reconstructs a credit account
func Hydrate(
	id string,
	userID string,
	balance int64,
	createdAt time.Time,
	updatedAt time.Time,
) *Account {
	return &Account{
		id:        HydrateID(id),
		userID:    userID,
		balance:   Amount{balance},
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func (ca *Account) ID() ID {
	return ca.id
}

func (ca *Account) UserID() string {
	return ca.userID
}

func (ca *Account) Balance() Amount {
	return ca.balance
}

func (ca *Account) CreatedAt() time.Time {
	return ca.createdAt
}

func (ca *Account) UpdatedAt() time.Time {
	return ca.updatedAt
}

func (ca *Account) AddCredits(amount Amount) error {
	newBalance, err := ca.balance.Add(amount)
	if err != nil {
		return err
	}
	ca.balance = newBalance
	ca.updatedAt = time.Now()
	return nil
}

func (ca *Account) DeductCredits(amount Amount) error {
	newBalance, err := ca.balance.Subtract(amount)
	if err != nil {
		return err
	}
	ca.balance = newBalance
	ca.updatedAt = time.Now()
	return nil
}

func (ca *Account) String() string {
	return fmt.Sprintf(
		"Account(ID: %s, UserID: %s, Balance: %s, CreatedAt: %s, UpdatedAt: %s)",
		ca.id,
		ca.userID,
		ca.balance,
		ca.createdAt.Format(time.RFC3339),
		ca.updatedAt.Format(time.RFC3339),
	)
}
