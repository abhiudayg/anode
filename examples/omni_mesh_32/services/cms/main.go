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
		port = "9024"
	}

	minioURL := os.Getenv("CMS_MINIO_URL")
	postgresURL := os.Getenv("CMS_POSTGRES_URL")

	dbMinio, _ := sql.Open("minio", minioURL)
	defer dbMinio.Close()

	dbPg, _ := sql.Open("postgres", postgresURL)
	defer dbPg.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/cms/pages", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"pages":[]}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
