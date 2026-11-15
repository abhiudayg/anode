package main

import (
	"net/http"
	"os"

	"example.com/stores/go.temporal.io/sdk/client"
	minio "example.com/stores/minio/minio-go/v7"
	"example.com/stores/mongo-driver/v2/mongo"
	"example.com/stores/mongo-driver/v2/mongo/options"
	amqp "example.com/stores/rabbitmq/amqp091-go"
)

func main() {
	_, _ = amqp.Dial(os.Getenv("EVENTS_RABBITMQ_URL"))
	_, _ = minio.New(os.Getenv("MEDIA_MINIO_ENDPOINT"))
	_, _ = mongo.Connect(options.Client().ApplyURI(os.Getenv("CATALOG_MONGO_URI")))
	_, _ = client.Dial(client.Options{HostPort: os.Getenv("JOBS_TEMPORAL_ADDR")})
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {})
	_ = http.ListenAndServe(":9000", mux)
}
