package main

import (
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/trading_engine/events"
	"fintech_core_20/services/trading_engine/handler"
	"fintech_core_20/services/trading_engine/orderbook"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8084"
	}

	cache := orderbook.New()
	defer cache.Close()

	bus, err := events.New()
	if err != nil {
		log.Fatalf("EventBus error: %v", err)
	}
	defer bus.Close()

	h := handler.New(cache, bus)
	mux := http.NewServeMux()
	h.Register(mux)

	log.Printf("[trading_engine] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
