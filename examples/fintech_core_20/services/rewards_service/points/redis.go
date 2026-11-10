package points

import (
	"os"

	"github.com/redis/go-redis/v9"
)

type PointsLedger struct {
	rdb *redis.Client
}

func New() *PointsLedger {
	return &PointsLedger{
		rdb: redis.NewClient(&redis.Options{Addr: os.Getenv("REWARDS_REDIS_ADDR")}),
	}
}

func (p *PointsLedger) Close() error {
	return p.rdb.Close()
}
