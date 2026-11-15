package mongo

import "example.com/stores/mongo-driver/v2/mongo/options"

type Client struct{}

func Connect(opts ...*options.ClientOptions) (*Client, error) {
	return &Client{}, nil
}
