package options

type ClientOptions struct{ uri string }

func Client() *ClientOptions { return &ClientOptions{} }

func (c *ClientOptions) ApplyURI(uri string) *ClientOptions {
	c.uri = uri
	return c
}
