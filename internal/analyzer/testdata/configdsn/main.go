package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
)

type Config struct {
	Database struct {
		DSN string `json:"dsn"`
	} `json:"database"`
	Redis struct {
		Addr string `json:"addr"`
	} `json:"redis"`
}

func main() {
	raw, err := os.ReadFile("config.json")
	if err != nil {
		panic(err)
	}
	var cfg Config
	if err := json.Unmarshal(raw, &cfg); err != nil {
		panic(err)
	}
	db, err := sql.Open("postgres", cfg.Database.DSN)
	if err != nil {
		panic(err)
	}
	defer db.Close()
	http.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
	http.ListenAndServe(":8080", nil)
}
