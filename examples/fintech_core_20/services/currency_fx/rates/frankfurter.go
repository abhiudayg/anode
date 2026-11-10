package rates

import (
	"context"
	"net/http"
)

type RatesClient struct{}

func New() *RatesClient {
	return &RatesClient{}
}

func (c *RatesClient) FetchRates(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "GET", "https://api.frankfurter.app/latest", nil)
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
