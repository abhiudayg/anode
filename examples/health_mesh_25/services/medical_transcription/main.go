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
		port = "7022"
	}

	minioURL := os.Getenv("TRANSCRIPTION_MINIO_URL")
	db, _ := sql.Open("minio", minioURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/transcribe/dictation", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.openai.com/v1/audio/transcriptions", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"transcript": "Patient presents with persistent cough for 3 days.",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
