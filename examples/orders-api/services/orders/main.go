package main

import (
	"database/sql"
	"encoding/json"
	"log"
	"net/http"
	"os"

	_ "github.com/jackc/pgx/v5/stdlib"
)

func main() {
	db, err := sql.Open("pgx", os.Getenv("ORDERS_DB_URL"))
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		var id int64
		err := db.QueryRowContext(r.Context(), "INSERT INTO orders (note) VALUES ($1) RETURNING id", r.URL.Query().Get("note")).Scan(&id)
		if err != nil {
			http.Error(w, "insert failed", http.StatusInternalServerError)
			return
		}
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusCreated)
		_ = json.NewEncoder(w).Encode(map[string]int64{"id": id})
	})

	log.Fatal(http.ListenAndServe(":"+os.Getenv("PORT"), mux))
}
