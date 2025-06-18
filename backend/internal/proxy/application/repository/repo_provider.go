package repository

type RepositoryProvider interface {
	ProviderRepository() ProviderRepository
}
