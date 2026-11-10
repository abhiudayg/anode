package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"fintech_core_20/services/fraud_guard/evaluator"
	"fintech_core_20/services/fraud_guard/vectors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8087"
	}

	vdb, err := vectors.New()
	if err != nil {
		log.Fatalf("VectorDB error: %v", err)
	}
	defer vdb.Close()

	ev := evaluator.New()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/fraud/evaluate", func(w http.ResponseWriter, r *http.Request) {
		passed := ev.CheckRisk(12000)
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"fraud_score": 0.002,
			"approved":    passed,
		})
	})

	log.Printf("[fraud_guard] Listening on :%s", port)
	_ = http.ListenAndServe(":"+port, mux)
}
