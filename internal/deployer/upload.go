package deployer

import (
	"bytes"
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"strings"
)

func (s *SSHClient) isRoot() bool {
	return s.user == "root"
}

func sudoWrap(cmd string) string {
	return "sudo -n sh -c " + shellQuoteArg(cmd)
}

func shellQuoteArg(value string) string {
	return "'" + strings.ReplaceAll(value, "'", `'\''`) + "'"
}

func (s *SSHClient) StreamBytes(data []byte, dstPath string, mode os.FileMode) error {
	return s.upload(bytes.NewReader(data), int64(len(data)), dstPath, mode)
}

func (s *SSHClient) StreamFile(srcPath string, dstPath string, mode os.FileMode) error {
	f, err := os.Open(srcPath)
	if err != nil {
		return fmt.Errorf("failed to open local file: %w", err)
	}
	defer f.Close()
	info, err := f.Stat()
	if err != nil {
		return err
	}
	return s.upload(f, info.Size(), dstPath, mode)
}

func (s *SSHClient) upload(body io.Reader, size int64, dstPath string, mode os.FileMode) error {
	if s.isRoot() {
		return s.scpTo(filepath.Dir(dstPath), filepath.Base(dstPath), mode, size, body)
	}
	stageName, err := stagingName()
	if err != nil {
		return err
	}
	if err := s.scpTo("/tmp", stageName, mode, size, body); err != nil {
		return err
	}
	stage := "/tmp/" + stageName
	_, err = s.Run(fmt.Sprintf("install -m %04o %s %s && rm -f %s", mode.Perm(), shellQuoteArg(stage), shellQuoteArg(dstPath), shellQuoteArg(stage)))
	return err
}

func (s *SSHClient) scpTo(dir string, base string, mode os.FileMode, size int64, body io.Reader) error {
	session, err := s.client.NewSession()
	if err != nil {
		return fmt.Errorf("failed to create SSH session for upload: %w", err)
	}
	defer session.Close()

	stdin, err := session.StdinPipe()
	if err != nil {
		return err
	}
	go func() {
		defer stdin.Close()
		fmt.Fprintf(stdin, "C%04o %d %s\n", mode.Perm(), size, base)
		_, _ = io.Copy(stdin, body)
		fmt.Fprint(stdin, "\x00")
	}()

	if err := session.Run("scp -t " + shellQuoteArg(dir)); err != nil {
		return fmt.Errorf("upload to %s failed: %w", filepath.Join(dir, base), err)
	}
	return nil
}

func stagingName() (string, error) {
	buf := make([]byte, 8)
	if _, err := rand.Read(buf); err != nil {
		return "", fmt.Errorf("failed to create staging name: %w", err)
	}
	return "anode-stage-" + hex.EncodeToString(buf), nil
}
