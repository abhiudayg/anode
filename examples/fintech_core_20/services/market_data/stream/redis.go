package stream

import (
	"os"

	"github.com/redis/go-redis/v9"
)

type Stream struct {
	rdb *redis.Client
}

func New() *Stream {
	return &Stream{
		rdb: redis.NewClient(&redis.Options{Addr: os.Getenv("MARKET_REDIS_ADDR")}),
	}
}

func (s *Stream) Close() error {
	return s.rdb.Close()
}
