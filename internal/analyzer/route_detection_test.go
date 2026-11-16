package analyzer

import (
	"os"
	"path/filepath"
	"slices"
	"testing"
)

func routesOf(t *testing.T, dir string) []string {
	t.Helper()
	lock, err := NewLoader(dir).LoadAndAnalyze("./...")
	if err != nil {
		t.Fatalf("analyze: %v", err)
	}
	var routes []string
	for _, svc := range lock.Services {
		for _, ing := range svc.Ingress {
			routes = append(routes, ing.Routes...)
		}
	}
	return routes
}

func writeRouteModule(t *testing.T, mainGo string) string {
	t.Helper()
	dir := t.TempDir()
	if err := os.WriteFile(filepath.Join(dir, "go.mod"), []byte("module example.com/app\n\ngo 1.22\n"), 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dir, "main.go"), []byte(mainGo), 0o644); err != nil {
		t.Fatal(err)
	}
	return dir
}

func TestPackageLevelHandleFuncRoutesAreDetected(t *testing.T) {
	dir := writeRouteModule(t, `package main

import "net/http"

func main() {
	http.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {})
	http.HandleFunc("POST /v1/orders", func(w http.ResponseWriter, r *http.Request) {})
	_ = http.ListenAndServe(":8080", nil)
}
`)
	routes := routesOf(t, dir)
	for _, want := range []string{"GET /healthz", "POST /v1/orders"} {
		if !slices.Contains(routes, want) {
			t.Fatalf("route %q not detected; got %v", want, routes)
		}
	}
}

func TestServeMuxMethodRoutesAreDetected(t *testing.T) {
	dir := writeRouteModule(t, `package main

import "net/http"

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /version", func(w http.ResponseWriter, r *http.Request) {})
	_ = http.ListenAndServe(":8080", mux)
}
`)
	routes := routesOf(t, dir)
	if !slices.Contains(routes, "GET /version") {
		t.Fatalf("ServeMux route not detected; got %v", routes)
	}
}
