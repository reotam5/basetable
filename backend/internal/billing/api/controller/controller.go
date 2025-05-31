package controller

import (
	"net/http"

	"github.com/basetable/basetable/backend/internal/billing/application/dto"
	"github.com/basetable/basetable/backend/internal/billing/application/service"
	authctx "github.com/basetable/basetable/backend/internal/shared/api/authcontext"
	hutil "github.com/basetable/basetable/backend/internal/shared/api/httputil"
)

type LedgerController interface {
	ListLedgerEntries(w http.ResponseWriter, r *http.Request)
}

type ledgerController struct {
	ledgerService service.LedgerService
}

func NewledgerController(ledgerService service.LedgerService) LedgerController {
	return &ledgerController{
		ledgerService: ledgerService,
	}
}

func (c *ledgerController) ListLedgerEntries(w http.ResponseWriter, r *http.Request) {
	accountID := authctx.GetAccountID(r.Context())
	entries, err := c.ledgerService.ListLedgerEntries(r.Context(), dto.ListLedgerEntriesRequest{
		AccountID: accountID,
	})
	if err != nil {
		hutil.WriteJSONErrorResponse(w, r, hutil.NewBadRequestError(err))
		return
	}

	hutil.WriteJSONResponse(w, r, entries)
}
