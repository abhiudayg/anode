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
		port = "9020"
	}

	temporalURL := os.Getenv("WORKFLOWS_TEMPORAL_URL")
	db, _ := sql.Open("temporal", temporalURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/workflows/start", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"workflow_id":"wf_abc","status":"running"}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
