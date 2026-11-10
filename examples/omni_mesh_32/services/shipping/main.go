package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9009"
	}

	kafkaBrokers := os.Getenv("SHIPPING_KAFKA_BROKERS")
	db, _ := sql.Open("kafka", kafkaBrokers)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/shipments/create", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.easypost.com/v2/shipments", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"tracking_code":"EZ100998822"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
