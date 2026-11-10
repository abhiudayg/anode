package main

import (
	"encoding/json"
	"net/http"
	"os"

	"github.com/redis/go-redis/v9"
	ehrv1 "health_mesh_25/proto/ehr/v1"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "7005"
	}

	redisAddr := os.Getenv("TELEHEALTH_REDIS_ADDR")
	ehrAddr := os.Getenv("EHR_GRPC_ADDR")

	rdb := redis.NewClient(&redis.Options{Addr: redisAddr})
	defer rdb.Close()

	ehrClient := ehrv1.NewEHRServiceClient(ehrAddr)

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/telehealth/session", func(w http.ResponseWriter, r *http.Request) {
		_, _ = ehrClient.GetPatientRecord("pat_101")
		w.Header().Set("Content-Type", "application/json")
		_ = json.NewEncoder(w).Encode(map[string]interface{}{
			"session_id": "call_room_449",
			"sdp_offer":  "v=0...",
		})
	})

	_ = http.ListenAndServe(":"+port, mux)
}
