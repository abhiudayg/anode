package twilio

import (
	"context"
	"net/http"
)

type Client struct{}

func New() *Client {
	return &Client{}
}

func (c *Client) SendSMS(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "POST", "https://api.twilio.com/2010-04-01/Accounts", nil)
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
