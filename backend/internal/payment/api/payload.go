package api

type CreatePaymentRequest struct {
	Amount   int64  `json:"amount"`
	Currency string `json:"currency"`
}

type CreatePaymentResponse struct {
	PaymentID   string `json:"payment_id"`
	ExternalID  string `json:"session_id"`
	ExternalURL string `json:"session_url"`
	Amount      int64  `json:"amount"`
	Currency    string `json:"currency"`
	CreatedAt   string `json:"created_at"`
}

type UpdatePaymentStatusRequest struct {
	PaymentID string `json:"payment_id"`
	Status    string `json:"status"`
}

type UpdatePaymentStatusResponse struct {
	PaymentID  string `json:"payment_id"`
	ExternalID string `json:"external_id"`
	Status     string `json:"status"`
	UpdatedAt  string `json:"updated_at"`
}
