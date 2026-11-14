package deployer

import (
	"net"
	"strings"
)

func IsIPTarget(target string) bool {
	host := target
	if idx := strings.LastIndex(host, "@"); idx >= 0 {
		host = host[idx+1:]
	}
	if idx := strings.LastIndex(host, ":"); idx >= 0 && strings.Count(host, ":") == 1 {
		host = host[:idx]
	}
	return net.ParseIP(host) != nil
}
