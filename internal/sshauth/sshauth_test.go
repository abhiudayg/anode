package sshauth

import (
	"crypto/ed25519"
	"crypto/rand"
	"testing"

	"golang.org/x/crypto/ssh"
)

func newSigner(t *testing.T) ssh.Signer {
	t.Helper()
	_, priv, err := ed25519.GenerateKey(rand.Reader)
	if err != nil {
		t.Fatal(err)
	}
	signer, err := ssh.NewSignerFromKey(priv)
	if err != nil {
		t.Fatal(err)
	}
	return signer
}

func TestCombineSignersKeepsAgentAndFileKeys(t *testing.T) {
	agentKey := newSigner(t)
	fileKey := newSigner(t)
	got := CombineSigners([]ssh.Signer{agentKey}, []ssh.Signer{fileKey})
	if len(got) != 2 || got[0] != agentKey || got[1] != fileKey {
		t.Fatalf("expected agent key then file key, got %d signers", len(got))
	}
}

func TestCombineSignersWithEmptyAgentStillOffersFileKey(t *testing.T) {
	fileKey := newSigner(t)
	got := CombineSigners(nil, []ssh.Signer{fileKey})
	if len(got) != 1 || got[0] != fileKey {
		t.Fatalf("a file key must still be offered when the agent has no keys, got %d", len(got))
	}
}
