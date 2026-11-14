package main

import (
	"io"
	"log"
	"net/http"
	"os"

	"github.com/minio/minio-go/v7"
	"github.com/minio/minio-go/v7/pkg/credentials"
)

const mediaBucket = "media"

func main() {
	objects, err := minio.New(os.Getenv("MEDIA_MINIO_ENDPOINT"), &minio.Options{
		Creds:  credentials.NewStaticV4(os.Getenv("MEDIA_MINIO_ACCESS_KEY"), os.Getenv("MEDIA_MINIO_SECRET_KEY"), ""),
		Secure: false,
	})
	if err != nil {
		log.Fatalf("minio: %v", err)
	}

	mux := http.NewServeMux()
	mux.HandleFunc("PUT /v1/media/{name}", func(w http.ResponseWriter, r *http.Request) {
		if _, err := objects.PutObject(r.Context(), mediaBucket, r.PathValue("name"), r.Body, -1,
			minio.PutObjectOptions{ContentType: r.Header.Get("Content-Type")}); err != nil {
			http.Error(w, "upload failed", http.StatusInternalServerError)
			return
		}
		w.WriteHeader(http.StatusCreated)
	})
	mux.HandleFunc("GET /v1/media/{name}", func(w http.ResponseWriter, r *http.Request) {
		obj, err := objects.GetObject(r.Context(), mediaBucket, r.PathValue("name"), minio.GetObjectOptions{})
		if err != nil {
			http.NotFound(w, r)
			return
		}
		defer obj.Close()
		info, err := obj.Stat()
		if err != nil {
			http.NotFound(w, r)
			return
		}
		w.Header().Set("Content-Type", info.ContentType)
		_, _ = io.Copy(w, obj)
	})

	log.Fatal(http.ListenAndServe(":"+envOr("PORT", "9017"), mux))
}

func envOr(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}
