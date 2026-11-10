package ledgerv1

type LedgerServiceClient interface {
	RecordTransaction(amount int64) error
}

type ledgerClient struct {
	addr string
}

func NewLedgerServiceClient(target string) LedgerServiceClient {
	return &ledgerClient{addr: target}
}

func (c *ledgerClient) RecordTransaction(amount int64) error {
	return nil
}

type LedgerServiceServer interface {
	RecordTransaction(amount int64) error
}

type ServerRegistrar interface{}

func RegisterLedgerServiceServer(s ServerRegistrar, srv LedgerServiceServer) {
	// gRPC server registration stub
}
