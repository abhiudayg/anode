package persona

import (
	"context"
	"net/http"
)

type Client struct{}

func New() *Client {
	return &Client{}
}

func (c *Client) SubmitInquiry(ctx context.Context) error {
	req, err := http.NewRequestWithContext(ctx, "POST", "https://withpersona.com/api/v1/inquiries", nil)
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
