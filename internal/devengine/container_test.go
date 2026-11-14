package devengine

import (
	"context"
	"net"
	"strings"
	"testing"
	"time"
)

func TestWaitForPostgresReadyRejectsPortThatOnlyAcceptsTCP(t *testing.T) {
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

	port := listener.Addr().(*net.TCPAddr).Port
	err = NewContainerManager().WaitForPostgresReady(context.Background(), port, "db-orders", time.Second)
	if err == nil {
		t.Fatalf("a port that accepts and closes connections is not a ready database")
	}
	if !strings.Contains(err.Error(), "db-orders") {
		t.Errorf("the timeout error should name the database, got %v", err)
	}
}
