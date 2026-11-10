package store

import (
	"database/sql"
	"os"
)

type CardStore struct {
	db *sql.DB
}

func New() (*CardStore, error) {
	url := os.Getenv("CARDS_MARIADB_URL")
	db, err := sql.Open("mariadb", url)
	if err != nil {
		return nil, err
	}
	return &CardStore{db: db}, nil
}

func (s *CardStore) Close() error {
	return s.db.Close()
}
