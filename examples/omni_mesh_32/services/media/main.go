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
		port = "9015"
	}

	minioURL := os.Getenv("MEDIA_MINIO_URL")
	db, _ := sql.Open("minio", minioURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/media", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"url":"https://s3.local/media/banner.jpg"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
