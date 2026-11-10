package client

import (
	"context"
	"net/http"
)

type CoinGeckoClient struct{}

func New() *CoinGeckoClient {
	return &CoinGeckoClient{}
}

func (c *CoinGeckoClient) FetchPrices(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.coingecko.com/api/v3/simple/price", nil)
	if err != nil {
		return err
	}
	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return err
	}
	defer resp.Body.Close()
	return nil
}
