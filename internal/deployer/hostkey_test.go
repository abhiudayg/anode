package deployer

import "testing"

func TestNewHostRequiresExplicitApproval(t *testing.T) {
	if err := checkNewHostTrust("", "203.0.113.5:22", "SHA256:abc"); err == nil {
		t.Fatalf("an unknown host must not be trusted without approval")
	}
	if err := checkNewHostTrust("0", "203.0.113.5:22", "SHA256:abc"); err == nil {
		t.Fatalf("only an explicit 1 approves a new host")
	}
	if err := checkNewHostTrust("1", "203.0.113.5:22", "SHA256:abc"); err != nil {
		t.Fatalf("approved host rejected: %v", err)
	}
}
