package domain

import (
	"fmt"
	"time"

	id "github.com/basetable/basetable/backend/shared/identity"
)

type CreditAccountID struct {
	value string
}

func NewCreditAccountID() CreditAccountID {
	return CreditAccountID{value: id.GenerateID()}
}

// ReconstructCreditAccountID reconstructs a credit account ID
func ReconstructCreditAccountID(value string) CreditAccountID {
	return CreditAccountID{value: value}
}

func (cid CreditAccountID) String() string {
	return cid.value
}

type CreditAccount struct {
	id        CreditAccountID
	userID    string
	balance   creditAmount
	createdAt time.Time
	updatedAt time.Time
}

// NewCreditAccount creates a new credit account for initial creation
func NewCreditAccount(userID string) *CreditAccount {
	return &CreditAccount{
		id:        NewCreditAccountID(),
		userID:    userID,
		balance:   0,
		createdAt: time.Now(),
		updatedAt: time.Now(),
	}
}

// RehydrateCreditAccount reconstructs a credit account
func RehydrateCreditAccount(
	id CreditAccountID,
	userID string,
	balance creditAmount,
	createdAt time.Time,
	updatedAt time.Time,
) *CreditAccount {
	return &CreditAccount{
		id:        id,
		userID:    userID,
		balance:   balance,
		createdAt: createdAt,
		updatedAt: updatedAt,
	}
}

func (ca *CreditAccount) ID() CreditAccountID {
	return ca.id
}

func (ca *CreditAccount) UserID() string {
	return ca.userID
}

func (ca *CreditAccount) Balance() creditAmount {
	return ca.balance
}

func (ca *CreditAccount) CreatedAt() time.Time {
	return ca.createdAt
}

func (ca *CreditAccount) UpdatedAt() time.Time {
	return ca.updatedAt
}

func (ca *CreditAccount) AddCredits(amount creditAmount) {
	ca.balance = ca.balance.Add(amount)
	ca.updatedAt = time.Now()
}

func (ca *CreditAccount) DeductCredits(amount creditAmount) error {
	newBalance, err := ca.balance.Subtract(amount)
	if err != nil {
		return err
	}
	ca.balance = newBalance
	ca.updatedAt = time.Now()
	return nil
}

func (ca *CreditAccount) String() string {
	return fmt.Sprintf(
		"CreditAccount(ID: %s, UserID: %s, Balance: %s, CreatedAt: %s, UpdatedAt: %s)",
		ca.id,
		ca.userID,
		ca.balance.String(),
		ca.createdAt.Format(time.RFC3339),
		ca.updatedAt.Format(time.RFC3339),
	)
}
