package minio

type Client struct{}

func New(endpoint string) (*Client, error) {
	return &Client{}, nil
}
