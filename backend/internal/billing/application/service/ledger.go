package service

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/ledger"
)

type LedgerService interface {
	ListLedgerEntries(context context.Context, request dto.ListLedgerEntriesRequest) (*dto.ListLedgerEntriesResponse, error)
	GetLedgerEntry(context context.Context, request dto.GetLedgerEntryRequest) (*dto.GetLedgerEntryResponse, error)
}

type ledgerService struct {
	ledgerRepository repository.LedgerRepository
}

var _ LedgerService = (*ledgerService)(nil)

func NewLedgerService(ledgerRepository repository.LedgerRepository) LedgerService {
	return &ledgerService{
		ledgerRepository: ledgerRepository,
	}
}

func (s *ledgerService) ListLedgerEntries(ctx context.Context, request dto.ListLedgerEntriesRequest) (*dto.ListLedgerEntriesResponse, error) {
	entries, err := s.ledgerRepository.GetByAccountID(ctx, request.AccountID)
	if err != nil {
		return nil, err
	}

	dtoEntries := make([]dto.LedgerEntry, 0, len(entries))
	for _, entry := range entries {
		dtoEntries = append(dtoEntries, s.mapDomainToDTO(entry))
	}

	return &dto.ListLedgerEntriesResponse{
		Entries: dtoEntries,
	}, nil
}

func (s *ledgerService) GetLedgerEntry(ctx context.Context, request dto.GetLedgerEntryRequest) (*dto.GetLedgerEntryResponse, error) {
	entry, err := s.ledgerRepository.GetByID(ctx, request.ID)
	if err != nil {
		return nil, err
	}

	return &dto.GetLedgerEntryResponse{
		Entry: s.mapDomainToDTO(entry),
	}, nil
}

func (s *ledgerService) mapDomainToDTO(entry *ledger.LedgerEntry) dto.LedgerEntry {
	return dto.LedgerEntry{
		ID:        entry.ID().String(),
		AccountID: entry.AccountID().String(),
		UserID:    entry.UserID(),
		Type:      entry.Type().String(),
		Operation: entry.Operation().String(),
		SourceID:  entry.SourceID(),
		Amount:    entry.Amount().Value(),
		Metadata:  entry.Metadata(),
		CreatedAt: entry.CreatedAt().Format(time.RFC3339),
	}
}
