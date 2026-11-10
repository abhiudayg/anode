package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7013"
	}

	kafkaBrokers := os.Getenv("VITALS_KAFKA_BROKERS")
	dbKafka, _ := sql.Open("kafka", kafkaBrokers)
	defer dbKafka.Close()

	clickURL := os.Getenv("VITALS_CLICKHOUSE_URL")
	dbClick, _ := sql.Open("clickhouse", clickURL)
	defer dbClick.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/vitals/stream", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"heart_rate_bpm": 72,
			"sp02_percent":   99,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
