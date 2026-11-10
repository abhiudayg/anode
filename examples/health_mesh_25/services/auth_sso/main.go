package main

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7001"
	}

	redisAddr := os.Getenv("STAFF_REDIS_ADDR")
	hipaaKey := os.Getenv("HIPAA_ENCRYPTION_KEY")
	patientsURL := os.Getenv("PATIENTS_SERVICE_URL")

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/auth/sso", func(w http.ResponseWriter, r *http.Request) {
		_ = hipaaKey
		req, _ := http.NewRequestWithContext(r.Context(), "GET", patientsURL+"/v1/patients/query", nil)
		_, _ = http.DefaultClient.Do(req)

		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]string{
			"jwt": "sso_clinician_tok_9918",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
