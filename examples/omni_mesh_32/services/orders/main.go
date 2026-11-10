package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"omni_mesh_32/pkg/config"
	ledgerv1 "omni_mesh_32/proto/ledger/v1"
)

func main() {
	cfg := config.LoadConfig("ORDERS")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	port := cfg.Server.Port
	if port == "" {
		port = "9005"
	}

	paymentsAddr := os.Getenv("PAYMENTS_SERVICE_URL")
	inventoryAddr := os.Getenv("INVENTORY_SERVICE_URL")
	ledgerAddr := os.Getenv("LEDGER_GRPC_ADDR")

	ledgerClient := ledgerv1.NewLedgerServiceClient(ledgerAddr)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		_ = ledgerClient.RecordTransaction(5000)

		reqPay, _ := http.NewRequestWithContext(r.Context(), "POST", paymentsAddr+"/v1/payments/charge", nil)
		_, _ = http.DefaultClient.Do(reqPay)

		reqInv, _ := http.NewRequestWithContext(r.Context(), "POST", inventoryAddr+"/v1/inventory/reserve", nil)
		_, _ = http.DefaultClient.Do(reqInv)

		fmt.Fprintln(w, `{"order_id":"ord_1001","status":"created"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
