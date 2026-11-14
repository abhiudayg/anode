package sshauth

import (
	"errors"
	"net"
	"os"
	"path/filepath"

	"golang.org/x/crypto/ssh"
	"golang.org/x/crypto/ssh/agent"
)

var keyFileNames = []string{"id_ed25519", "id_rsa"}

func AuthMethods() ([]ssh.AuthMethod, error) {
	var agentSigners []ssh.Signer
	if sock := os.Getenv("SSH_AUTH_SOCK"); sock != "" {
		if conn, err := net.Dial("unix", sock); err == nil {
			if signers, err := agent.NewClient(conn).Signers(); err == nil {
				agentSigners = signers
			}
		}
	}

	home, _ := os.UserHomeDir()
	var fileSigners []ssh.Signer
	for _, name := range keyFileNames {
		data, err := os.ReadFile(filepath.Join(home, ".ssh", name))
		if err != nil {
			continue
		}
		if signer, err := ssh.ParsePrivateKey(data); err == nil {
			fileSigners = append(fileSigners, signer)
		}
	}

	signers := CombineSigners(agentSigners, fileSigners)
	if len(signers) == 0 {
		return nil, errors.New("no SSH keys found: start ssh-agent with a key, or create ~/.ssh/id_ed25519")
	}
	return []ssh.AuthMethod{ssh.PublicKeys(signers...)}, nil
}

func CombineSigners(agentSigners, fileSigners []ssh.Signer) []ssh.Signer {
	combined := make([]ssh.Signer, 0, len(agentSigners)+len(fileSigners))
	combined = append(combined, agentSigners...)
	return append(combined, fileSigners...)
}
