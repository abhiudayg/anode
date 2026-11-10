package main

import (
	"database/sql"
	"fmt"
	"net/http"

	"hyper_mesh_12/pkg/config"
)

func main() {
	cfg := config.LoadFromNestedLayers("USERPROFILE")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/users/profile", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"user_id":42,"tier":"premium"}`)
	})

	_ = http.ListenAndServe(":"+cfg.Server.Port, mux)
}
