package deployer

import (
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
)

func checkDotEnvPermissions(rootDir string) error {
	info, err := os.Stat(filepath.Join(rootDir, ".env"))
	if errors.Is(err, fs.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	if info.Mode().Perm()&0o077 != 0 {
		return fmt.Errorf(".env is readable by other users (mode %o): run chmod 600 .env", info.Mode().Perm())
	}
	return nil
}
