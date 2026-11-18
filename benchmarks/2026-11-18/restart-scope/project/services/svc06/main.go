// Synthetic service for the restart-scope proof. Its version string is what changes between deploys.
package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
)

const version = "v1"

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) {
		fmt.Fprintf(w, "svc06 %s pid=%d\n", version, os.Getpid())
	})
	log.Fatal(http.ListenAndServe(":"+os.Getenv("PORT"), mux))
}
