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
		port = "7019"
	}

	minioURL := os.Getenv("GENOMICS_MINIO_URL")
	db, _ := sql.Open("minio", minioURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/genomics/fast-q/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"sequencer": "Illumina_NovaSeq",
			"reads":     100000000,
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
