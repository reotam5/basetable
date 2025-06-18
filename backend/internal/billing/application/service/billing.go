package service

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/account"
	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
	"github.com/basetable/basetable/backend/internal/billing/domain/reservation"
	"github.com/basetable/basetable/backend/internal/billing/domain/service"
	"github.com/basetable/basetable/backend/internal/payment/domain"
	"github.com/basetable/basetable/backend/internal/shared/application/unitofwork"
	shared "github.com/basetable/basetable/backend/internal/shared/domain"
)

type BillingService interface {
	HandlePaymentCompleted(ctx context.Context, event shared.Event) error
	ReserveCredits(ctx context.Context, request dto.ReserveCreditRequest) (*dto.ReserveCreditResponse, error)
	CommitReservation(ctx context.Context, request dto.CommitReservationRequest) (*dto.CommitReservationResponse, error)
	ReleaseReservation(ctx context.Context, request dto.ReleaseReservationRequest) (*dto.ReleaseReservationResponse, error)
}

type billingService struct {
	domainService service.BillingService
	uow           unitofwork.UnitOfWork[repository.RepositoryProvider]
}

var _ BillingService = (*billingService)(nil)

func NewBillingService(uow unitofwork.UnitOfWork[repository.RepositoryProvider]) BillingService {
	return &billingService{
		uow: uow,
	}
}

func (s *billingService) HandlePaymentCompleted(ctx context.Context, event shared.Event) error {
	if event.Type != domain.PaymentCompletedEvent {
		return nil
	}

	payload, ok := event.Payload.(domain.PaymentEventPayload)
	if !ok {
		return nil
	}

	return s.uow.Do(ctx, func(ctx context.Context, provider repository.RepositoryProvider) error {
		acc, err := provider.AccountRepository().GetByIDForUpdate(ctx, payload.AccountID)
		if err != nil {
			return err
		}

		credits, _ := account.NewAmount(payload.Amount)
		ledgerEntry, err := s.domainService.AddPaymentCredits(acc, credits, payload.PaymentID, map[string]any{
			"sent_at":      event.Timestamp,
			"processed_at": time.Now(),
		})
		if err != nil {
			return err
		}

		saves := []func() error{
			func() error { return provider.AccountRepository().Save(ctx, acc) },
			func() error { return provider.LedgerRepository().Save(ctx, ledgerEntry) },
		}

		return s.flushSaves(saves)
	})
}

func (s *billingService) ReserveCredits(ctx context.Context, request dto.ReserveCreditRequest) (*dto.ReserveCreditResponse, error) {
	credits, err := account.NewAmount(request.Amount)
	if err != nil {
		return nil, err
	}

	var (
		rsvt      *reservation.Reservation
		ledgerEnt *ledger.LedgerEntry
	)

	if err = s.uow.Do(ctx, func(ctx context.Context, provider repository.RepositoryProvider) error {
		acc, err := provider.AccountRepository().GetByIDForUpdate(ctx, request.AccountID)
		if err != nil {
			return err
		}

		rsvt, ledgerEnt, err = s.domainService.ReserveCredits(acc, credits)
		if err != nil {
			return err
		}

		saves := []func() error{
			func() error { return provider.AccountRepository().Save(ctx, acc) },
			func() error { return provider.ReservationRepository().Save(ctx, rsvt) },
			func() error { return provider.LedgerRepository().Save(ctx, ledgerEnt) },
		}

		return s.flushSaves(saves)
	}); err != nil {
		return nil, err
	}

	return &dto.ReserveCreditResponse{
		ReservationID: rsvt.ID().String(),
		LedgerEntryID: ledgerEnt.ID().String(),
	}, nil
}

func (s *billingService) CommitReservation(ctx context.Context, request dto.CommitReservationRequest) (*dto.CommitReservationResponse, error) {
	actualAmount, err := account.NewAmount(request.ActualAmount)
	if err != nil {
		return nil, err
	}

	var ledgerEnt *ledger.LedgerEntry

	if err = s.uow.Do(ctx, func(ctx context.Context, provider repository.RepositoryProvider) error {
		rsvt, err := provider.ReservationRepository().GetByIDForUpdate(ctx, request.ReservationID)
		if err != nil {
			return err
		}

		acc, err := provider.AccountRepository().GetByIDForUpdate(ctx, rsvt.UserID())
		if err != nil {
			return err
		}

		ledgerEnt, err = s.domainService.CommitReservation(acc, rsvt, actualAmount)
		if err != nil {
			return err
		}

		saves := []func() error{
			func() error { return provider.AccountRepository().Save(ctx, acc) },
			func() error { return provider.ReservationRepository().Save(ctx, rsvt) },
		}

		// No ledger entry created if the reservation matches the actual amount
		if ledgerEnt != nil {
			saves = append(saves, func() error {
				return provider.LedgerRepository().Save(ctx, ledgerEnt)
			})
		}

		return s.flushSaves(saves)
	}); err != nil {
		return nil, err
	}

	if ledgerEnt != nil {
		return &dto.CommitReservationResponse{
			LedgerEntryID: ledgerEnt.ID().String(),
		}, nil
	}

	return nil, nil
}

func (s *billingService) ReleaseReservation(ctx context.Context, request dto.ReleaseReservationRequest) (*dto.ReleaseReservationResponse, error) {
	var ledgerEnt *ledger.LedgerEntry
	if err := s.uow.Do(ctx, func(ctx context.Context, provider repository.RepositoryProvider) error {
		rsvt, err := provider.ReservationRepository().GetByIDForUpdate(ctx, request.ReservationID)
		if err != nil {
			return err
		}

		acc, err := provider.AccountRepository().GetByIDForUpdate(ctx, rsvt.UserID())
		if err != nil {
			return err
		}

		ledgerEnt, err = s.domainService.ReleaseReservation(acc, rsvt)
		if err != nil {
			return err
		}

		saves := []func() error{
			func() error { return provider.AccountRepository().Save(ctx, acc) },
			func() error { return provider.ReservationRepository().Save(ctx, rsvt) },
			func() error { return provider.LedgerRepository().Save(ctx, ledgerEnt) },
		}

		return s.flushSaves(saves)
	}); err != nil {
		return nil, err
	}

	return &dto.ReleaseReservationResponse{
		LedgerEntryID: ledgerEnt.ID().String(),
	}, nil
}

func (s *billingService) flushSaves(saves []func() error) error {
	for _, save := range saves {
		if err := save(); err != nil {
			return err
		}
	}
	return nil
}
