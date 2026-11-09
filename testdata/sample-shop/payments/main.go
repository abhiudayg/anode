package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
)

type Config struct {
	Port        string
	DatabaseURL string
}

func loadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	return &Config{
		Port:        port,
		DatabaseURL: os.Getenv("PAYMENTS_DB_URL"),
	}
}

func main() {
	cfg := loadConfig()

	// Stateful dependency: Postgres for payments
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open payments db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/charges", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprintln(w, `{"status":"charged"}`)
	})

	addr := ":" + cfg.Port
	log.Printf("Payments service running on %s", addr)
	_ = http.ListenAndServe(addr, mux)
}
