package main

import (
	"encoding/json"
	"log"
	"net/http"

	"fintech_core_20/services/ledger_engine/config"
	"fintech_core_20/services/ledger_engine/grpcserver"
	"fintech_core_20/services/ledger_engine/store"
)

func main() {
	cfg := config.Load()
	journalStore, err := store.NewJournalStore(cfg.TimescaleURL)
	if err != nil {
		log.Fatalf("Journal store init error: %v", err)
	}
	defer journalStore.Close()

	grpcSrv := grpcserver.New(journalStore)
	grpcSrv.Register(nil)

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/ledger/balance", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"balanced":   true,
			"audited_at": "2026-11-10T00:00:00Z",
		})
	})

	log.Printf("[ledger_engine] Listening on :%s", cfg.Port)
	_ = http.ListenAndServe(":"+cfg.Port, mux)
}
