package devengine

import (
	"context"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"
)

func TestWaitForHealthAcceptsAnyHTTPResponse(t *testing.T) {
	server := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, _ *http.Request) {
		w.WriteHeader(http.StatusNotFound)
	}))
	defer server.Close()
	if !WaitForHealth(context.Background(), server.URL+"/", 2*time.Second) {
		t.Fatalf("a service that answers HTTP, even with 404, is ready")
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
	url := "http://" + listener.Addr().String() + "/"
	if WaitForHealth(context.Background(), url, time.Second) {
		t.Fatalf("a port that accepts TCP and drops the connection is not a ready service")
	}
}
