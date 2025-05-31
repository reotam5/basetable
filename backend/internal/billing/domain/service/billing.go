package service

import (
	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/billing/domain/errors"
	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
)

type BillingService struct{}

func (s *BillingService) ReserveCredits(
	acc *account.Account, amount account.Amount,
) (*reservation.Reservation, *ledger.LedgerEntry, error) {
	rsvt := reservation.New(acc.ID(), acc.UserID(), amount)
	ledgerEnt, err := s.deductCredits(acc, amount, rsvt.ID().String(), ledger.EntryTypeReservation, map[string]any{})
	if err != nil {
		return nil, nil, err
	}

	return rsvt, ledgerEnt, nil
}

func (s *BillingService) CommitReservation(
	acc *account.Account, rsvt *reservation.Reservation, actualAmount account.Amount,
) (*ledger.LedgerEntry, error) {
	if err := s.checkMatchingAccountID(acc, rsvt); err != nil {
		return nil, err
	}

	if err := rsvt.EnsurePending(); err != nil {
		return nil, err
	}

	var (
		ledgerEnt *ledger.LedgerEntry
		err       error
	)

	diff := rsvt.Amount().Value() - actualAmount.Value()
	switch {
	case diff > 0:
		refund, _ := account.NewAmount(diff)
		ledgerEnt, err = s.addCredits(
			acc,
			refund,
			rsvt.ID().String(),
			ledger.EntryTypeAdjustment,
			map[string]any{"type": "refund"},
		)
	case diff < 0:
		surcharge, _ := account.NewAmount(-diff)
		ledgerEnt, err = s.deductCredits(
			acc,
			surcharge,
			rsvt.ID().String(),
			ledger.EntryTypeAdjustment,
			map[string]any{"type": "surcharge"},
		)
	}

	if err != nil {
		return nil, err
	}

	rsvt.Commit(actualAmount)
	return ledgerEnt, nil
}

func (s *BillingService) ReleaseReservation(
	acc *account.Account, rsvt *reservation.Reservation,
) (*ledger.LedgerEntry, error) {
	if err := s.checkMatchingAccountID(acc, rsvt); err != nil {
		return nil, err
	}

	if err := rsvt.EnsurePending(); err != nil {
		return nil, err
	}

	ledgerEnt, err := s.addCredits(
		acc,
		rsvt.Amount(),
		rsvt.ID().String(),
		ledger.EntryTypeAdjustment,
		map[string]any{"type": "release"},
	)
	if err != nil {
		return nil, err
	}

	rsvt.Release()
	return ledgerEnt, nil
}

func (s *BillingService) checkMatchingAccountID(
	acc *account.Account, rsvt *reservation.Reservation,
) error {
	if rsvt.AccountID() != acc.ID() {
		return errors.NewAccountIDMismatchError(rsvt.AccountID().String(), acc.ID().String())
	}
	return nil
}

func (s *BillingService) AddPaymentCredits(
	acc *account.Account,
	amount account.Amount,
	paymentID string,
	metadata map[string]any,
) (*ledger.LedgerEntry, error) {
	return s.addCredits(acc, amount, paymentID, ledger.EntryTypePayment, metadata)
}

func (s *BillingService) AddManualCredits(
	acc *account.Account,
	amount account.Amount,
	adminID string,
	metadata map[string]any,
) (*ledger.LedgerEntry, error) {
	return s.addCredits(acc, amount, adminID, ledger.EntryTypeManual, metadata)
}

func (s *BillingService) DeductManualCredits(
	acc *account.Account,
	amount account.Amount,
	adminID string,
	metadata map[string]any,
) (*ledger.LedgerEntry, error) {
	return s.deductCredits(acc, amount, adminID, ledger.EntryTypeManual, metadata)
}

func (s *BillingService) addCredits(
	acc *account.Account,
	amount account.Amount,
	sourceID string,
	entryType ledger.EntryType,
	metadata map[string]any,
) (*ledger.LedgerEntry, error) {
	if err := acc.AddCredits(amount); err != nil {
		return nil, err
	}

	return ledger.NewEntry(
		acc.ID(),
		acc.UserID(),
		entryType,
		ledger.OperationAdd,
		sourceID,
		amount,
		metadata,
	), nil
}

func (s *BillingService) deductCredits(
	acc *account.Account,
	amount account.Amount,
	sourceID string,
	entryType ledger.EntryType,
	metadata map[string]any,
) (*ledger.LedgerEntry, error) {
	if err := acc.DeductCredits(amount); err != nil {
		return nil, err
	}

	return ledger.NewEntry(
		acc.ID(),
		acc.UserID(),
		entryType,
		ledger.OperationDeduct,
		sourceID,
		amount,
		metadata,
	), nil
}
