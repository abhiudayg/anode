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
		port = "9021"
	}

	cockroachURL := os.Getenv("SUBS_COCKROACH_URL")
	db, _ := sql.Open("cockroachdb", cockroachURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/subscriptions/create", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"sub_id":"sub_777","status":"active"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
