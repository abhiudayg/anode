package stripe

import (
	"context"
	"net/http"
	"os"
)

type Client struct {
	secretKey string
}

func New() *Client {
	return &Client{
		secretKey: os.Getenv("STRIPE_API_SECRET_KEY"),
	}
}

func (c *Client) CreateIntent(ctx context.Context) error {
	_ = c.secretKey
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.stripe.com/v1/payment_intents", nil)
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
