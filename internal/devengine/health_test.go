package devengine

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func serverWithStatus(t *testing.T, status int) *httptest.Server {
	t.Helper()
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(status)
	}))
	t.Cleanup(server.Close)
	return server
}

func TestWaitForHealthAcceptsSuccessfulHealthRoute(t *testing.T) {
	server := serverWithStatus(t, http.StatusOK)
	if !WaitForHealth(context.Background(), server.URL+healthPath, 2*time.Second) {
		t.Fatalf("a health route that returns 200 is ready")
	}
}

func TestWaitForHealthRejectsErrorStatuses(t *testing.T) {
	for _, status := range []int{http.StatusNotFound, http.StatusInternalServerError} {
		server := serverWithStatus(t, status)
		if WaitForHealth(context.Background(), server.URL+healthPath, time.Second) {
			t.Errorf("a health route that returns %d is not ready", status)
		}
	}
}

func TestWaitForHealthRejectsPortThatDropsConnections(t *testing.T) {
	listener, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	defer listener.Close()
	go func() {
		for {
			conn, err := listener.Accept()
			if err != nil {
				return
			}
			_ = conn.Close()
		}
	}()
	url := "http://" + listener.Addr().String() + healthPath
	if WaitForHealth(context.Background(), url, time.Second) {
		t.Fatalf("a port that accepts TCP and drops the connection is not a ready service")
	}
}
