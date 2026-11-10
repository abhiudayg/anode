package pdf

import (
	"database/sql"
	"os"
)

type Storage struct {
	db *sql.DB
}

func New() (*Storage, error) {
	url := os.Getenv("STATEMENTS_MINIO_URL")
	db, err := sql.Open("minio", url)
	if err != nil {
		return nil, err
	}
	return &Storage{db: db}, nil
}

func (s *Storage) Close() error {
	return s.db.Close()
}
