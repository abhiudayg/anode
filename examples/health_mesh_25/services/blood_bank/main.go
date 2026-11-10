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
		port = "7021"
	}

	mariadbURL := os.Getenv("BLOODBANK_MARIADB_URL")
	db, _ := sql.Open("mariadb", mariadbURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/bloodbank/inventory", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]int{
			"O_NEG": 45,
			"A_POS": 120,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
