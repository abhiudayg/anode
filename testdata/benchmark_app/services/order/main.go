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
		DatabaseURL:    os.Getenv("ORDER_DB_URL"),
		PaymentService: os.Getenv("PAYMENT_SERVICE_URL"),
		StripeAPIKey:   os.Getenv("STRIPE_SECRET_KEY"),
	}
}

func deadHelperThatShouldBePruned() {
	// If RTA/call-graph works properly, this uncalled DB must NEVER appear in iag.json!
	_, _ = sql.Open("postgres", os.Getenv("UNUSED_DEAD_DB_URL"))
}

func main() {
	cfg := loadConfig()

	// Live Sink 1: Postgres Database
	db, err := sql.Open("postgres", cfg.DatabaseURL)
	if err != nil {
		log.Fatalf("failed to connect to db: %v", err)
	}
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {
		// Live Sink 2: Outbound HTTP call to payment-service
		req, _ := http.NewRequestWithContext(r.Context(), "POST", cfg.PaymentService+"/v1/charges", nil)
		_, _ = http.DefaultClient.Do(req)

		w.WriteHeader(http.StatusCreated)
		_, _ = fmt.Fprintln(w, `{"status":"order_created"}`)
	})

	// Live Sink 3: Ingress HTTP server
	addr := ":" + cfg.Port
	log.Printf("Order service listening on %s", addr)
	if err := http.ListenAndServe(addr, mux); err != nil {
		log.Fatal(err)
	}
}
