package main

import (
	"database/sql"
	"fmt"
	"net/http"

	"omni_mesh_32/pkg/config"
)

func main() {
	cfg := config.LoadConfig("USERS")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	port := cfg.Server.Port
	if port == "" {
		port = "9002"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/users", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"users":[]}`)
	})
	mux.HandleFunc("GET /v1/users/lookup", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"id":"usr_123","valid":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
