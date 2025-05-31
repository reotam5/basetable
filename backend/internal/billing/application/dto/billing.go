package dto

type ReserveCreditRequest struct {
	AccountID string
	Amount    int64
}

type ReserveCreditResponse struct {
	ReservationID string
	LedgerEntryID string
}

type CommitReservationRequest struct {
	ReservationID string
	ActualAmount  int64
}

type CommitReservationResponse struct {
	LedgerEntryID string
}

type ReleaseReservationRequest struct {
	ReservationID string
}

type ReleaseReservationResponse struct {
	LedgerEntryID string
}
