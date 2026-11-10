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
		port = "7012"
	}

	qdrantURL := os.Getenv("CLINICAL_QDRANT_URL")
	db, _ := sql.Open("qdrant", qdrantURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/ai/symptom-match", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"differential_diagnosis": []string{"Hypertension", "Hyperglycemia"},
			"confidence":             0.94,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
