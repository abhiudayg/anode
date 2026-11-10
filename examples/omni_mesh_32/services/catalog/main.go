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
		port = "9003"
	}

	mongoURL := os.Getenv("CATALOG_MONGO_URL")
	db, _ := sql.Open("mongodb", mongoURL)
	defer db.Close()

	searchAddr := os.Getenv("SEARCH_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/catalog/items", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", searchAddr+"/v1/search/sync", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"items":[]}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
