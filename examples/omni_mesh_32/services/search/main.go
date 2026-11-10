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
		port = "9004"
	}

	qdrantURL := os.Getenv("SEARCH_QDRANT_URL")
	db, _ := sql.Open("qdrant", qdrantURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/search", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"results":[]}`)
	})
	mux.HandleFunc("GET /v1/search/sync", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"synced":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
