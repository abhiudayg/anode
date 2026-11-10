package main

import (
	"database/sql"
	"encoding/json"
	"net/http"
	"os"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7009"
	}

	minioURL := os.Getenv("RADIOLOGY_MINIO_URL")
	db, _ := sql.Open("minio", minioURL)
	defer db.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("GET /v1/radiology/dicom/{id}", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"study_uid":   "1.2.840.10008.1.1",
			"modality":    "MRI",
			"storage_uri": "s3://pacs/dicom/study_881.dcm",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
