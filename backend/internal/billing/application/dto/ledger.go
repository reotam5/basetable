package dto

// LedgerEntry represents a single ledger entry
type LedgerEntry struct {
	ID        string
	AccountID string
	UserID    string
	Type      string
	Operation string
	SourceID  string
	Amount    int64
	Metadata  map[string]any
	CreatedAt string
}

type ListLedgerEntriesRequest struct {
	AccountID string
}

type ListLedgerEntriesResponse struct {
	Entries []LedgerEntry
}

type GetLedgerEntryRequest struct {
	ID string
}

type GetLedgerEntryResponse struct {
	Entry LedgerEntry
}
