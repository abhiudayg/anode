package main

import (
	"context"
	"io"
	"net"
	"net/http"
	"testing"
	"time"
)

// serve must not return while a request is still running: the process exits
// when serve returns, which would cut that request off.
func TestServeWaitsForInFlightRequest(t *testing.T) {
	handlerDone := make(chan struct{})
	mux := http.NewServeMux()
	mux.HandleFunc("GET /slow", func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(1500 * time.Millisecond)
		_, _ = io.WriteString(w, "done")
		close(handlerDone)
	})
	ln, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	serveErr := make(chan error, 1)
	go func() { serveErr <- serve(ctx, &http.Server{Handler: mux}, ln, 5*time.Second) }()

	type result struct {
		status int
		body   string
		err    error
	}
	resCh := make(chan result, 1)
	go func() {
		resp, err := http.Get("http://" + ln.Addr().String() + "/slow")
		if err != nil {
			resCh <- result{err: err}
			return
		}
		defer resp.Body.Close()
		b, _ := io.ReadAll(resp.Body)
		resCh <- result{status: resp.StatusCode, body: string(b)}
	}()

	time.Sleep(300 * time.Millisecond) // the request is now in flight
	cancel()                           // SIGTERM equivalent

	if err := <-serveErr; err != nil {
		t.Fatalf("serve returned %v", err)
	}
	select {
	case <-handlerDone:
	default:
		t.Fatal("serve returned while the request was still running")
	}
	r := <-resCh
	if r.err != nil || r.status != http.StatusOK || r.body != "done" {
		t.Fatalf("in-flight request failed: status=%d body=%q err=%v", r.status, r.body, r.err)
	}
}
