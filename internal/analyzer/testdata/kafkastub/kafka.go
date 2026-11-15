package kafka

import "net"

type Writer struct {
	Addr  net.Addr
	Topic string
}

func TCP(addrs ...string) net.Addr {
	return nil
}
