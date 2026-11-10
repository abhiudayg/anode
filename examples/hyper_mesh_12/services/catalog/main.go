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
		port = "8003"
	}

	// Read-only catalog pointing to unmanaged shared catalog DB
	db, _ := sql.Open("postgres", os.Getenv("EXTERNAL_CATALOG_DB_URL"))
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/catalog/items", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `[{"item":"laptop","stock":15}]`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
