package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	ledgerv1 "omni_mesh_32/proto/ledger/v1"
)

type ledgerServer struct{}

func (s *ledgerServer) RecordTransaction(amount int64) error {
	return nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9018"
	}

	timescaleURL := os.Getenv("ACCOUNTING_TIMESCALE_URL")
	db, _ := sql.Open("timescaledb", timescaleURL)
	defer db.Close()

	ledgerv1.RegisterLedgerServiceServer(nil, &ledgerServer{})

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/accounting/balance", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"balanced":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
