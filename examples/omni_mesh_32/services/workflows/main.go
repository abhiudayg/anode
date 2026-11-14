package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"

	"go.temporal.io/sdk/client"
)

const workflowQueue = "workflows"

func main() {
	temporal, err := client.Dial(client.Options{HostPort: os.Getenv("WORKFLOWS_TEMPORAL_ADDR")})
	if err != nil {
		log.Fatalf("temporal: %v", err)
	}
	defer temporal.Close()

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/workflows/{type}/{id}", func(w http.ResponseWriter, r *http.Request) {
		var input json.RawMessage
		if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
			http.Error(w, "invalid input", http.StatusBadRequest)
			return
		}
		run, err := temporal.ExecuteWorkflow(r.Context(),
			client.StartWorkflowOptions{ID: r.PathValue("type") + "-" + r.PathValue("id"), TaskQueue: workflowQueue},
			r.PathValue("type"), input)
		if err != nil {
			http.Error(w, "could not start workflow", http.StatusServiceUnavailable)
			return
		}
		w.WriteHeader(http.StatusAccepted)
		_ = json.NewEncoder(w).Encode(map[string]string{"workflow_id": run.GetID(), "run_id": run.GetRunID()})
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9032"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
