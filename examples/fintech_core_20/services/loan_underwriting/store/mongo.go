package store

import (
	"database/sql"
	"os"
)

type LoanStore struct {
	db *sql.DB
}

func New() (*LoanStore, error) {
	url := os.Getenv("LOANS_MONGO_URL")
	db, err := sql.Open("mongodb", url)
	if err != nil {
		return nil, err
	}
	return &LoanStore{db: db}, nil
}

func (s *LoanStore) Close() error {
	return s.db.Close()
}
