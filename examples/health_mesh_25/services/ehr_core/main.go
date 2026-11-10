package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"

	ehrv1 "health_mesh_25/proto/ehr/v1"
)

type ehrServer struct{}

func (s *ehrServer) GetPatientRecord(patientID string) (string, error) {
	return `{"resourceType":"Bundle","id":"ehr_bundle_1"}`, nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7003"
	}

	mongoURL := os.Getenv("EHR_MONGO_URL")
	db, _ := sql.Open("mongodb", mongoURL)
	defer db.Close()

	ehrv1.RegisterEHRServiceServer(nil, &ehrServer{})

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/ehr/patient/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"ehr_record_id": "ehr_rec_99",
			"status":        "verified",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
