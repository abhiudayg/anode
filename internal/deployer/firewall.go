package deployer

import "fmt"

const serviceEndPort = 21999

func AppPortIptablesRule() string {
	return fmt.Sprintf("-p tcp --dport %d:%d ! -i lo -j DROP", firstServicePort, serviceEndPort)
}

func appPortFirewallCommand() string {
	rule := AppPortIptablesRule()
	return fmt.Sprintf(
		"(command -v iptables >/dev/null 2>&1 || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables >/dev/null) && (iptables -C INPUT %s 2>/dev/null || iptables -I INPUT %s) && (command -v netfilter-persistent >/dev/null 2>&1 || DEBIAN_FRONTEND=noninteractive apt-get install -y -qq iptables-persistent >/dev/null) && netfilter-persistent save >/dev/null",
		rule, rule,
	)
}
