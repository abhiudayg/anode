package main

import (
	"database/sql"
	"fmt"
	"net/http"
	"os"

	fraudv1 "omni_mesh_32/proto/fraud/v1"
)

type fraudServer struct{}

func (s *fraudServer) EvaluateRisk(txID string) (float64, error) {
	return 0.01, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9017"
	}

	scyllaURL := os.Getenv("FRAUD_SCYLLA_URL")
	db, _ := sql.Open("scylladb", scyllaURL)
	defer db.Close()

	fraudv1.RegisterFraudServer(nil, &fraudServer{})

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/fraud/check", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, `{"risk_score":0.01,"approved":true}`)
	})

	_ = http.ListenAndServe(":"+port, mux)
}
