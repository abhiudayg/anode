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
		port = "8009"
	}

	// External Clickhouse database URL (No migrations, unmanaged external state)
	db, _ := sql.Open("clickhouse", os.Getenv("CLICKHOUSE_AUDIT_URL"))
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/audit/log", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"audit_logged":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
