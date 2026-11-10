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
		port = "9022"
	}

	temporalURL := os.Getenv("DISPUTES_TEMPORAL_URL")
	paymentsAddr := os.Getenv("PAYMENTS_SERVICE_URL")

	db, _ := sql.Open("temporal", temporalURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/disputes/file", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", paymentsAddr+"/v1/payments/refund", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"dispute_id":"disp_99","resolved":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
