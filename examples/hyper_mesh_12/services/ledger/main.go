package main

import (
	"fmt"
	"net"
	"os"

	ledgerv1 "hyper_mesh_12/proto/ledger/v1"
)

type ledgerServer struct{}

func (s *ledgerServer) RecordTransaction(amount int64) error {
	return nil
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9000"
	}

	lis, _ := net.Listen("tcp", ":"+port)
	defer lis.Close()

	// Register gRPC server
	ledgerv1.RegisterLedgerServiceServer(nil, &ledgerServer{})
	fmt.Printf("Ledger gRPC server listening on :%s\n", port)
}
