package store

import (
	"database/sql"
	"os"
)

type Store struct {
	db *sql.DB
}

func New() (*Store, error) {
	url := os.Getenv("PAYMENTS_SCYLLA_URL")
	db, err := sql.Open("scylladb", url)
	if err != nil {
		return nil, err
	}
	return &Store{db: db}, nil
}

func (s *Store) Close() error {
	return s.db.Close()
}
