package queue

import (
	"database/sql"
	"os"
)

type NotificationQueue struct {
	db *sql.DB
}

func New() (*NotificationQueue, error) {
	url := os.Getenv("NOTIFICATIONS_RABBITMQ_URL")
	db, err := sql.Open("rabbitmq", url)
	if err != nil {
		return nil, err
	}
	return &NotificationQueue{db: db}, nil
}

func (q *NotificationQueue) Close() error {
	return q.db.Close()
}
