package main

import (
	"context"
	"log"
	"net/http"
	"os"

	"example.com/pgxpool"
)

func main() {
	pool, err := pgxpool.New(context.Background(), os.Getenv("ORDERS_POSTGRES_DSN"))
	if err != nil {
		log.Fatal(err)
	}
	_ = pool
	log.Fatal(http.ListenAndServe(":9001", nil))
}
