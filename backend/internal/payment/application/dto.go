package application

type CreatePaymentRequest struct {
	AccountID string
	Amount    int64
	Currency  string
}

type CreatePaymentResponse struct {
	PaymentID     string
	ExternalID    string
	ExternalURL   string
	Amount        int64
	Currency      string
	PaymentStatus string
	CreatedAt     string
}

type UpdatePaymentStatusRequest struct {
	PaymentID string
	Status    string
}

type UpdatePaymentStatusResponse struct {
	PaymentID  string
	AccountID  string
	ExternalID string
	Status     string
	UpdatedAt  string
}
