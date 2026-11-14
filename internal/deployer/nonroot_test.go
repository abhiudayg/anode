package deployer

import (
	"strings"
	"testing"
)

func TestSudoWrapRunsNonRootCommandsWithoutPrompt(t *testing.T) {
	got := sudoWrap("systemctl restart 'anode-orders.service'")
	if !strings.HasPrefix(got, "sudo -n sh -c ") {
		t.Fatalf("expected non-interactive sudo, got %s", got)
	}
}

func TestShellQuoteArgNeutralisesQuotes(t *testing.T) {
	if got := shellQuoteArg("a'b; id"); got != "'a'\\''b; id'" {
		t.Errorf("shellQuoteArg = %s", got)
	}
}

func TestHostSetupRejectsBadInputBeforeConnecting(t *testing.T) {
	root := &SSHClient{user: "root"}
	if err := HostSetup(root, "bad user;id", "ssh-ed25519 AAAA test"); err == nil {
		t.Errorf("expected an invalid user name to be rejected")
	}
	if err := HostSetup(root, "anode-deploy", "ssh-ed25519 AAAA\nexport X=1"); err == nil {
		t.Errorf("expected a multi-line key to be rejected")
	}
	nonRoot := &SSHClient{user: "anode-deploy"}
	if err := HostSetup(nonRoot, "anode-deploy", "ssh-ed25519 AAAA test"); err == nil {
		t.Errorf("expected host setup to refuse a non-root connection")
	}
}
