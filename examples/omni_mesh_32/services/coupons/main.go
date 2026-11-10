package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9027"
	}

	memcacheURL := os.Getenv("COUPONS_MEMCACHED_URL")
	pgURL := os.Getenv("COUPONS_POSTGRES_URL")

	dbMem, _ := sql.Open("memcached", memcacheURL)
	defer dbMem.Close()

	dbPg, _ := sql.Open("postgres", pgURL)
	defer dbPg.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/coupons/apply", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"valid":true,"discount_percent":20}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
