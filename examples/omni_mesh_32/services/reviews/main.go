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
		port = "9023"
	}

	mongoURL := os.Getenv("REVIEWS_MONGO_URL")
	db, _ := sql.Open("mongodb", mongoURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/reviews/submit", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"review_id":"rev_1","rating":5}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
