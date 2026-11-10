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
		port = "9016"
	}

	minioURL := os.Getenv("DOCS_MINIO_URL")
	mongoURL := os.Getenv("DOCS_MONGO_URL")

	dbMinio, _ := sql.Open("minio", minioURL)
	defer dbMinio.Close()

	dbMongo, _ := sql.Open("mongodb", mongoURL)
	defer dbMongo.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/documents/invoice", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"doc_id":"doc_123","format":"pdf"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
