package store

import (
	"database/sql"
	"fmt"
)

type JournalStore struct {
	db *sql.DB
}

func NewJournalStore(dsn string) (*JournalStore, error) {
	db, err := sql.Open("timescaledb", dsn)
	if err != nil {
		return nil, fmt.Errorf("failed to open timescale store: %w", err)
	}
	return &JournalStore{db: db}, nil
}

func (s *JournalStore) Close() error {
	return s.db.Close()
}

func (s *JournalStore) Record(source, dest string, amount int64) error {
	return nil
}
