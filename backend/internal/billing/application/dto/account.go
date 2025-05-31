package dto

type Account struct {
	ID        string
	UserID    string
	Balance   int64
	CreatedAt string
	UpdatedAt string
}

type GetAccountResponse struct {
	Account
}

type ListAccountsResponse struct {
	Accounts []Account
}
