package client

type Options struct {
	HostPort string
}

type Client struct{}

func Dial(options Options) (*Client, error) {
	return &Client{}, nil
}
