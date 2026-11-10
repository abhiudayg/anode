package ledgerv1

type LedgerServiceClient struct {
	addr string
}

func NewLedgerServiceClient(addr string) *LedgerServiceClient {
	return &LedgerServiceClient{addr: addr}
}

func (c *LedgerServiceClient) PostJournalEntry(sourceAccount, destAccount string, amountCents int64) error {
	return nil
}

type LedgerServer interface {
	PostJournalEntry(string, string, int64) error
}

func RegisterLedgerServiceServer(s interface{}, srv LedgerServer) {}
