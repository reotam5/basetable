package ledger

import (
	"fmt"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/shared/domain"
)

type ID = domain.ID[LedgerEntry]

var (
	NewID     = domain.NewID[LedgerEntry]
	HydrateID = domain.HydrateID[LedgerEntry]
)

type EntryType struct {
	value string
}

var (
	EntryTypePayment     = EntryType{"PAYMENT"}
	EntryTypeReservation = EntryType{"RESERVATION"}
	EntryTypeAdjustment  = EntryType{"ADJUSTMENT"}
	EntryTypeManual      = EntryType{"MANUAL"}
)

func (t EntryType) String() string {
	return t.value
}

type LedgerEntry struct {
	id        ID
	accountID account.ID
	userID    string
	entryType EntryType
	operation Operation
	sourceID  string
	amount    account.Amount
	metadata  map[string]any
	createdAt time.Time
}

func NewEntry(
	accountID account.ID,
	userID string,
	entryType EntryType,
	operation Operation,
	sourceID string,
	amount account.Amount,
	metadata map[string]any,
) *LedgerEntry {
	return &LedgerEntry{
		id:        NewID(),
		accountID: accountID,
		userID:    userID,
		entryType: entryType,
		operation: operation,
		sourceID:  sourceID,
		amount:    amount,
		metadata:  metadata,
		createdAt: time.Now(),
	}
}

func HydrateEntry(
	id string,
	accountID string,
	userID string,
	entryType string,
	operation string,
	sourceID string,
	amount int64,
	metadata map[string]any,
	createdAt time.Time,
) *LedgerEntry {
	return &LedgerEntry{
		id:        HydrateID(id),
		accountID: account.HydrateID(accountID),
		userID:    userID,
		entryType: EntryType{entryType},
		operation: Operation{operation},
		sourceID:  sourceID,
		amount:    account.HydrateAmount(amount),
		metadata:  metadata,
		createdAt: createdAt,
	}
}

func (ce *LedgerEntry) ID() ID {
	return ce.id
}

func (ce *LedgerEntry) AccountID() account.ID {
	return ce.accountID
}

func (ce *LedgerEntry) Type() EntryType {
	return ce.entryType
}

func (c *LedgerEntry) SourceID() string {
	return c.sourceID
}

func (c *LedgerEntry) Operation() Operation {
	return c.operation
}

func (c *LedgerEntry) UserID() string {
	return c.userID
}

func (c *LedgerEntry) Amount() account.Amount {
	return c.amount
}

func (c *LedgerEntry) Metadata() map[string]any {
	return c.metadata
}

func (c *LedgerEntry) CreatedAt() time.Time {
	return c.createdAt
}

func (c *LedgerEntry) String() string {
	return fmt.Sprintf(
		"LedgerEntry(ID: %s, AccountID: %s, UserID: %s, EntryType: %s, SourceID: %s, Amount: %d, CreatedAt: %s)",
		c.id,
		c.accountID,
		c.userID,
		c.entryType,
		c.sourceID,
		c.amount,
		c.createdAt.Format(time.RFC3339),
	)
}
