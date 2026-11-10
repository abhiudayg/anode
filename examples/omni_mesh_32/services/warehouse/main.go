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
		port = "9008"
	}

	rabbitURL := os.Getenv("WAREHOUSE_RABBITMQ_URL")
	db, _ := sql.Open("rabbitmq", rabbitURL)
	defer db.Close()

	shippingAddr := os.Getenv("SHIPPING_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/warehouse/pack", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", shippingAddr+"/v1/shipments/create", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"packed":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
