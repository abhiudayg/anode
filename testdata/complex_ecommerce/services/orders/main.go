package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
)

type Config struct {
	Port         string
	DBHost       string
	DBPort       string
	DBUser       string
	DBName       string
	CatalogAddr  string
	StripeSecret string
}

func loadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8082"
	}
	return &Config{
		Port:         port,
		DBHost:       os.Getenv("ORDERS_DB_HOST"),
		DBPort:       os.Getenv("ORDERS_DB_PORT"),
		DBUser:       os.Getenv("ORDERS_DB_USER"),
		DBName:       os.Getenv("ORDERS_DB_NAME"),
		CatalogAddr:  os.Getenv("CATALOG_SERVICE_URL"),
		StripeSecret: os.Getenv("STRIPE_SECRET_KEY"),
	}
}

func main() {
	cfg := loadConfig()

	// Composite DSN construction (Stress tests recursive backward taint tracer)
	dsn := fmt.Sprintf("postgres://%s@%s:%s/%s?sslmode=disable", cfg.DBUser, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		log.Fatalf("failed to open orders db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		// Outbound internal call to catalog service
		catalogReq, _ := http.NewRequestWithContext(r.Context(), "GET", cfg.CatalogAddr+"/v1/products", nil)
		_, _ = http.DefaultClient.Do(catalogReq)

		// Outbound external call to Stripe API (Stress tests external egress classifier)
		stripeReq, _ := http.NewRequestWithContext(r.Context(), "POST", "https://api.stripe.com/v1/charges", nil)
		_, _ = http.DefaultClient.Do(stripeReq)

		w.WriteHeader(http.StatusCreated)
		fmt.Fprintln(w, `{"status":"order_placed"}`)
	})

	addr := ":" + cfg.Port
	log.Printf("Orders service listening on %s", addr)
	_ = http.ListenAndServe(addr, mux)
}
