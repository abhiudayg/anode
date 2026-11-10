package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/statement_gen/pdf"
	"fintech_core_20/services/statement_gen/queue"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8093"
	}

	st, err := pdf.New()
	if err != nil {
		log.Fatalf("Storage error: %v", err)
	}
	defer st.Close()

	q, err := queue.New()
	if err != nil {
		log.Fatalf("Queue error: %v", err)
	}
	defer q.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/statements/generate", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"statement_id": "stmt_2026_11",
			"status":       "queued",
		})
	})

	log.Printf("[statement_gen] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
