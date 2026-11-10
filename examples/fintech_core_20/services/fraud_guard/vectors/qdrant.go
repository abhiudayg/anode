package vectors

import (
	"database/sql"
	"os"
)

type VectorDB struct {
	db *sql.DB
}

func New() (*VectorDB, error) {
	url := os.Getenv("FRAUD_QDRANT_URL")
	db, err := sql.Open("qdrant", url)
	if err != nil {
		return nil, err
	}
	return &VectorDB{db: db}, nil
}

func (v *VectorDB) Close() error {
	return v.db.Close()
}
