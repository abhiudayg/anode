package main

import (
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/compliance_audit/handler"
	"fintech_core_20/services/compliance_audit/store"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8089"
	}

	st, err := store.New()
	if err != nil {
		log.Fatalf("ClickHouse store error: %v", err)
	}
	defer st.Close()

	h := handler.New(st)
	mux := http.NewServeMux()
	h.Register(mux)

	log.Printf("[compliance_audit] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
