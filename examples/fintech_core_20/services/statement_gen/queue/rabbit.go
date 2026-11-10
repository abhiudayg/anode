package queue

import (
	"database/sql"
	"os"
)

type WorkerQueue struct {
	db *sql.DB
}

func New() (*WorkerQueue, error) {
	url := os.Getenv("STATEMENTS_RABBITMQ_URL")
	db, err := sql.Open("rabbitmq", url)
	if err != nil {
		return nil, err
	}
	return &WorkerQueue{db: db}, nil
}

func (q *WorkerQueue) Close() error {
	return q.db.Close()
}
