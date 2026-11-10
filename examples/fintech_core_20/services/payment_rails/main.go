package main

import (
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/payment_rails/handler"
	"fintech_core_20/services/payment_rails/store"
	"fintech_core_20/services/payment_rails/stripe"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8086"
	}

	st, err := store.New()
	if err != nil {
		log.Fatalf("Scylla store error: %v", err)
	}
	defer st.Close()

	sc := stripe.New()
	h := handler.New(st, sc)

	mux := http.NewServeMux()
	h.Register(mux)

	log.Printf("[payment_rails] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
