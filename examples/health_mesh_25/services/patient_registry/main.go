package main

import (
	"database/sql"
	"encoding/json"
	"net/http"

	"health_mesh_25/pkg/config"
)

func main() {
	cfg := config.LoadConfig("PATIENTS")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	port := cfg.Port
	if port == "" {
		port = "7002"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/patients/query", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"mrn":        "urn:uuid:123e4567-e89b-12d3-a456-426614174000",
			"first_name": "Jane",
			"last_name":  "Doe",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
