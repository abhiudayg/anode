package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	"hyper_mesh_12/pkg/config"
)

func main() {
	cfg := config.LoadFromNestedLayers("FULFILLMENT")

	db, _ := sql.Open("postgres", cfg.Database.DSN())
	defer db.Close()

	notifAddr := os.Getenv("NOTIFICATIONS_SERVICE_URL")

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/fulfillment/dispatch", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", notifAddr+"/v1/notify/shipment", nil)
		_, _ = http.DefaultClient.Do(req)

		fmt.Fprintln(w, `{"tracking_number":"TRK_777"}`)
	})

	_ = http.ListenAndServe(":"+cfg.Server.Port, mux)
}
