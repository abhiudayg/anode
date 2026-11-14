package pgxpool

import "context"

type Pool struct{}

func New(ctx context.Context, dsn string) (*Pool, error) {
	return NewWithConfig(ctx, dsn)
}

func NewWithConfig(ctx context.Context, dsn string) (*Pool, error) {
	return &Pool{}, nil
}
