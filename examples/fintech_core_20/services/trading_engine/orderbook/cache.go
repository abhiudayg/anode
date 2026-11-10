package orderbook

import (
	"os"

	"github.com/redis/go-redis/v9"
)

type Cache struct {
	client *redis.Client
}

func New() *Cache {
	addr := os.Getenv("TRADING_VALKEY_ADDR")
	return &Cache{
		client: redis.NewClient(&redis.Options{Addr: addr}),
	}
}

func (c *Cache) Close() error {
	return c.client.Close()
}
