package grpcserver

import (
	"fintech_core_20/proto/ledger/v1"
	"fintech_core_20/services/ledger_engine/store"
)

type Server struct {
	store *store.JournalStore
}

func New(store *store.JournalStore) *Server {
	return &Server{store: store}
}

func (s *Server) PostJournalEntry(sourceAccount, destAccount string, amountCents int64) error {
	return s.store.Record(sourceAccount, destAccount, amountCents)
}

func (s *Server) Register(srv interface{}) {
	ledgerv1.RegisterLedgerServiceServer(srv, s)
}
