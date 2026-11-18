// slowsvc is the drain experiment's service. Mode "plain" exits as soon as the
// listener is closed, the pattern anode's reference service had before the fix.
// Mode "drain" stops accepting, waits for in-flight requests, then exits.
package main

import (
	"context"
	"errors"
	"flag"
	"io"
	"log"
	"net"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

func mux() *http.ServeMux {
	m := http.NewServeMux()
	m.HandleFunc("GET /healthz", func(w http.ResponseWriter, _ *http.Request) { w.WriteHeader(200) })
	m.HandleFunc("GET /slow1500", func(w http.ResponseWriter, _ *http.Request) {
		time.Sleep(1500 * time.Millisecond)
		_, _ = io.WriteString(w, "done")
	})
	return m
}

func serveDrain(ctx context.Context, srv *http.Server, ln net.Listener, drain time.Duration) error {
	errCh := make(chan error, 1)
	go func() { errCh <- srv.Serve(ln) }()
	select {
	case err := <-errCh:
		return err
	case <-ctx.Done():
	}
	shutdownCtx, cancel := context.WithTimeout(context.Background(), drain)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		return err
	}
	if err := <-errCh; err != nil && !errors.Is(err, http.ErrServerClosed) {
		return err
	}
	return nil
}

func main() {
	mode := flag.String("mode", "drain", "plain | drain")
	port := flag.String("port", "9030", "")
	flag.Parse()
	ln, err := net.Listen("tcp", "0.0.0.0:"+*port)
	if err != nil {
		log.Fatal(err)
	}
	srv := &http.Server{Handler: mux()}
	if *mode == "plain" {
		// Like the pre-fix reference service: the process exits when Serve returns.
		// A SIGTERM closes nothing itself, so the default handler kills the process at once.
		log.Fatal(srv.Serve(ln))
	}
	ctx, stop := signal.NotifyContext(context.Background(), syscall.SIGTERM, os.Interrupt)
	defer stop()
	if err := serveDrain(ctx, srv, ln, 8*time.Second); err != nil {
		log.Fatal(err)
	}
}
