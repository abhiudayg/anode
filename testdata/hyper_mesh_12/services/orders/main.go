package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"hyper_mesh_12/pkg/config"
	ledgerv1 "hyper_mesh_12/proto/ledger/v1"
)

func main() {
	cfg := config.LoadFromNestedLayers("ORDERS")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	// Outbound Typed gRPC client to ledger-service
	ledgerAddr := os.Getenv("LEDGER_GRPC_ADDR")
	ledgerClient := ledgerv1.NewLedgerServiceClient(ledgerAddr)

	paymentsAddr := os.Getenv("PAYMENTS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		_ = ledgerClient.RecordTransaction(1500)

		// Internal call to payments
		req, _ := http.NewRequestWithContext(r.Context(), "POST", paymentsAddr+"/v1/payments/charge", nil)
		_, _ = http.DefaultClient.Do(req)

		fmt.Fprintln(w, `{"order_id":"ord_999","status":"processing"}`)
	})

	_ = http.ListenAndServe(":"+cfg.Server.Port, mux)
}
