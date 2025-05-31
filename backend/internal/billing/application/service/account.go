package service

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
)

type AccountService interface {
	GetAccount(ctx context.Context, accountID string) (*dto.GetAccountResponse, error)
}

type accountService struct {
	accountRepository repository.AccountRepository
}

var _ AccountService = (*accountService)(nil)

func NewAccountService(accountRepository repository.AccountRepository) AccountService {
	return &accountService{
		accountRepository: accountRepository,
	}
}

func (s *accountService) GetAccount(ctx context.Context, accountID string) (*dto.GetAccountResponse, error) {
	acc, err := s.accountRepository.GetByID(ctx, accountID)
	if err != nil {
		return nil, err
	}

	return &dto.GetAccountResponse{
		Account: dto.Account{
			ID:        acc.ID().String(),
			UserID:    acc.UserID(),
			Balance:   acc.Balance().Value(),
			CreatedAt: acc.CreatedAt().Format(time.RFC3339),
			UpdatedAt: acc.UpdatedAt().Format(time.RFC3339),
		},
	}, nil
}
