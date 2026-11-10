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
	RedisAddr   string
}

func loadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8081"
	}
	return &Config{
		Port:        port,
		DatabaseURL: os.Getenv("CATALOG_DB_URL"),
		RedisAddr:   os.Getenv("REDIS_ADDR"),
	}
}

// Dead helper: must be pruned by VTA
func deadCatalogHelper() {
	_, _ = sql.Open("postgres", os.Getenv("DEAD_CATALOG_DB_URL"))
}

func main() {
	cfg := loadConfig()

	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open catalog db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/products", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		fmt.Fprintln(w, `[{"id":1,"name":"Mechanical Keyboard","price":120.00}]`)
	})

	addr := ":" + cfg.Port
	log.Printf("Catalog service listening on %s", addr)
	_ = http.ListenAndServe(addr, mux)
}
