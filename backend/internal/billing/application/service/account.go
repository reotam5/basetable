package service

import (
	"context"
	"time"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/repository"
	"github.com/basetable/basetable/backend/internal/billing/domain/account"
)

type AccountService interface {
	GetAccount(ctx context.Context, accountID string) (*dto.GetAccountResponse, error)
	CreateAccount(ctx context.Context, req dto.CreateAccountRequest) (*dto.CreateAccountResponse, error)
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

func (s *accountService) CreateAccount(ctx context.Context, req dto.CreateAccountRequest) (*dto.CreateAccountResponse, error) {
	acc := account.New(req.UserID)
	if err := s.accountRepository.Save(ctx, acc); err != nil {
		return nil, err
	}

	return &dto.CreateAccountResponse{
		Account: dto.Account{
			ID:        acc.ID().String(),
			UserID:    acc.UserID(),
			Balance:   acc.Balance().Value(),
			CreatedAt: acc.CreatedAt().Format(time.RFC3339),
			UpdatedAt: acc.UpdatedAt().Format(time.RFC3339),
		},
	}, nil
}
