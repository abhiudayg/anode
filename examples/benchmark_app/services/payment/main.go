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
		DatabaseURL: os.Getenv("PAYMENT_DB_URL"),
	}
}

func main() {
	cfg := loadConfig()

	// Live Sink 1: Postgres Database for Payment
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to payment db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	// Live Ingress Route
	mux.HandleFunc("POST /v1/charges", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		_, _ = fmt.Fprintln(w, `{"status":"charged"}`)
	})

	addr := ":" + cfg.Port
	log.Printf("Payment service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
