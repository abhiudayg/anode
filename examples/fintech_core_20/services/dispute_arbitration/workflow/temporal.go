package workflow

import (
	"database/sql"
	"os"
)

type Engine struct {
	db *sql.DB
}

func New() (*Engine, error) {
	url := os.Getenv("DISPUTES_TEMPORAL_URL")
	db, err := sql.Open("temporal", url)
	if err != nil {
		return nil, err
	}
	return &Engine{db: db}, nil
}

func (e *Engine) Close() error {
	return e.db.Close()
}
