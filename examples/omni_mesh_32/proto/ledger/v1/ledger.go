package ledgerv1

type LedgerServiceClient struct {
	addr string
}

func NewLedgerServiceClient(addr string) *LedgerServiceClient {
	return &LedgerServiceClient{addr: addr}
}

func (c *LedgerServiceClient) RecordTransaction(amount int64) error {
	return nil
}

type LedgerServer interface {
	RecordTransaction(int64) error
}

func RegisterLedgerServiceServer(s interface{}, srv LedgerServer) {}
