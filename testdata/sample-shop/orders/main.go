package main

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"os"
)

type Config struct {
	Port           string
	DatabaseURL    string
	PaymentService string
	StripeAPIKey   string
}

func loadConfig() *Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	return &Config{
		Port:           port,
		DatabaseURL:    os.Getenv("ORDERS_DB_URL"),
		PaymentService: os.Getenv("PAYMENT_SERVICE_URL"),
		StripeAPIKey:   os.Getenv("STRIPE_SECRET_KEY"),
	}
}

// Dead helper: must be pruned by reachability analysis
func uncalledDeadRedis() {
	_ = os.Getenv("DEAD_REDIS_URL")
}

func main() {
	cfg := loadConfig()

	// Stateful dependency: Postgres
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to open db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		// Outbound service invocation to payments
		req, _ := http.NewRequestWithContext(r.Context(), "POST", cfg.PaymentService+"/v1/charges", nil)
		_, _ = http.DefaultClient.Do(req)

		w.WriteHeader(http.StatusCreated)
		_, _ = fmt.Fprintln(w, `{"order_id":"ord_123"}`)
	})

	addr := ":" + cfg.Port
	log.Printf("Orders service running on %s", addr)
	_ = http.ListenAndServe(addr, mux)
}
