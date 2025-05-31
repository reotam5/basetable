package repository

type RepositoryProvider interface {
	AccountRepository() AccountRepository
	LedgerRepository() LedgerRepository
	ReservationRepository() ReservationRepository
}
