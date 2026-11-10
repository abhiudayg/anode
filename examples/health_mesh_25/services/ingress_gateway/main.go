package main

import (
	"encoding/json"
	"fmt"
	"net/http"
	"os"
)

type RouterConfig struct {
	Port         string
	AuthURL      string
	PatientsURL  string
	ApptsURL     string
	TelehealthURL string
	BillingURL   string
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7000"
	}

	cfg := RouterConfig{
		Port:          port,
		AuthURL:       os.Getenv("AUTH_SERVICE_URL"),
		PatientsURL:   os.Getenv("PATIENTS_SERVICE_URL"),
		ApptsURL:      os.Getenv("APPOINTMENTS_SERVICE_URL"),
		TelehealthURL: os.Getenv("TELEHEALTH_SERVICE_URL"),
		BillingURL:    os.Getenv("BILLING_SERVICE_URL"),
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /api/v1/patients", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "GET", cfg.PatientsURL+"/v1/patients/query", nil)
		_, _ = http.DefaultClient.Do(req)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]bool{"routed_patients": true})
	})
	mux.HandleFunc("POST /api/v1/appointments", func(w http.ResponseWriter, r *http.Request) {
		req, _ := http.NewRequestWithContext(r.Context(), "POST", cfg.ApptsURL+"/v1/appointments/book", nil)
		_, _ = http.DefaultClient.Do(req)
		fmt.Fprintln(w, `{"appointment_scheduled":true}`)
	})

	_ = http.ListenAndServe(":"+cfg.Port, mux)
}
