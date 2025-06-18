package controller

import (
	"encoding/json"
	"net/http"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/service"
	authctx "github.com/basetable/basetable/backend/internal/shared/api/authcontext"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

type CreateAccountRequest struct {
	UserID string `json:"user_id"`
}

type CreateAccountResponse struct {
	AccountID string `json:"account_id"`
}

type GetAccountResponse struct {
	ID        string `json:"id"`
	UserID    string `json:"user_id"`
	Balance   int64  `json:"balance"`
	CreatedAt string `json:"created_at"`
	UpdatedAt string `json:"updated_at"`
}

type AccountController interface {
	GetAccount(w http.ResponseWriter, r *http.Request)
	CreateAccount(w http.ResponseWriter, r *http.Request)
}

type accountController struct {
	accountService service.AccountService
	logger         log.Logger
}

func NewAccountController(accountService service.AccountService, logger log.Logger) AccountController {
	return &accountController{
		accountService: accountService,
		logger:         logger,
	}
}

func (c *accountController) GetAccount(w http.ResponseWriter, r *http.Request) {
	accountID := authctx.GetAccountID(r.Context())
	accountDTO, err := c.accountService.GetAccount(r.Context(), accountID)
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	hutil.WriteJSONResponse(w, r, GetAccountResponse{
		ID:        accountDTO.ID,
		UserID:    accountDTO.UserID,
		Balance:   accountDTO.Balance,
		CreatedAt: accountDTO.CreatedAt,
		UpdatedAt: accountDTO.UpdatedAt,
	})
}

func (c *accountController) CreateAccount(w http.ResponseWriter, r *http.Request) {
	var req CreateAccountRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	accountDTO, err := c.accountService.CreateAccount(r.Context(), dto.CreateAccountRequest{UserID: req.UserID})
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewInternalError(err))
		return
	}

	c.logger.Infof("Successfully created account: %v", accountDTO)
	hutil.WriteJSONResponseWithStatus(w, r, http.StatusCreated, CreateAccountResponse{
		AccountID: accountDTO.Account.ID,
	})
}
