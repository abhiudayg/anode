package amqp

type Connection struct{}

func Dial(url string) (*Connection, error) {
	return &Connection{}, nil
}
