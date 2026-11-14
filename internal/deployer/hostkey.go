package deployer

import "fmt"

func checkNewHostTrust(approval string, hostname string, fingerprint string) error {
	if approval == "1" {
		return nil
	}
	return fmt.Errorf("first connection to %s (host key %s): confirm the fingerprint on the server, then re-run with ANODE_TRUST_NEW_HOST=1", hostname, fingerprint)
}
