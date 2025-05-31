package controller

import (
	"net/http"

	"github.com/basetable/basetable/backend/internal/billing/application/service"
	authctx "github.com/basetable/basetable/backend/internal/shared/api/authcontext"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
	"github.com/basetable/basetable/backend/internal/shared/log"
)

type AccountController interface {
	GetAccount(w http.ResponseWriter, r *http.Request)
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

	hutil.WriteJSONResponse(w, r, accountDTO)
}
