package deployer

import "os"

type Remote interface {
	Run(cmd string) (string, error)
	StreamBytes(data []byte, dstPath string, mode os.FileMode) error
	StreamFile(srcPath string, dstPath string, mode os.FileMode) error
}
