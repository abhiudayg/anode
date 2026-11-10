package evaluator

import (
	"os"

	ledgerv1 "fintech_core_20/proto/ledger/v1"
)

type Client struct {
	ledgerClient *ledgerv1.LedgerServiceClient
}

func New() *Client {
	addr := os.Getenv("LEDGER_GRPC_ADDR")
	return &Client{
		ledgerClient: ledgerv1.NewLedgerServiceClient(addr),
	}
}

func (c *Client) CheckRisk(amount int64) bool {
	_ = c.ledgerClient.PostJournalEntry("fraud_check", "internal", amount)
	return true
}
