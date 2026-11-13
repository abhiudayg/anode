package doctor

import (
	"bufio"
	"bytes"
	"context"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"regexp"
	"strconv"
	"strings"
)

const CategoryToolchain = "TOOLCHAIN & COMPILER"

var semverRegex = regexp.MustCompile(`go(\d+)\.(\d+)(?:\.(\d+))?`)

type versionTuple struct {
	major int
	minor int
	patch int
}

func parseGoVersion(raw string) (versionTuple, bool) {
	m := semverRegex.FindStringSubmatch(raw)
	if len(m) < 3 {
		return versionTuple{}, false
	}
	major, _ := strconv.Atoi(m[1])
	minor, _ := strconv.Atoi(m[2])
	patch := 0
	if len(m) >= 4 && m[3] != "" {
		patch, _ = strconv.Atoi(m[3])
	}
	return versionTuple{major: major, minor: minor, patch: patch}, true
}

func (v versionTuple) compare(o versionTuple) int {
	if v.major != o.major {
		if v.major > o.major {
			return 1
		}
		return -1
	}
	if v.minor != o.minor {
		if v.minor > o.minor {
			return 1
		}
		return -1
	}
	if v.patch != o.patch {
		if v.patch > o.patch {
			return 1
		}
		return -1
	}
	return 0
}

// CheckGoCompiler verifies the presence and version of the Go compiler.
func CheckGoCompiler(ctx context.Context, targetDir string) CheckResult {
	goPath, err := exec.LookPath("go")
	if err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Go Compiler Presence",
			Status:      StatusFail,
			Message:     "Go compiler binary not found in PATH",
			Remediation: "Install Go (>= 1.27) from https://go.dev/dl/ or via your system package manager.",
		}
	}

	cmd := exec.CommandContext(ctx, goPath, "version")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Go Compiler Execution",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Failed to query Go compiler version: %v", err),
			Remediation: "Verify your Go toolchain installation: 'go version'.",
		}
	}
	rawVer := strings.TrimSpace(string(out))
	installedVer, ok := parseGoVersion(rawVer)
	if !ok {
		return CheckResult{
			Category: CategoryToolchain,
			Name:     "Go Compiler Version",
			Status:   StatusOK,
			Message:  fmt.Sprintf("Detected Go: %s", rawVer),
		}
	}

	// Check against go.mod requirement if present
	modPath := filepath.Join(targetDir, "go.mod")
	if reqVer, err := extractGoModVersion(modPath); err == nil && reqVer != "" {
		requiredVer, okReq := parseGoVersion("go" + reqVer)
		if okReq && installedVer.compare(requiredVer) < 0 {
			return CheckResult{
				Category:    CategoryToolchain,
				Name:        "Go Compiler Version",
				Status:      StatusFail,
				Message:     fmt.Sprintf("Installed Go (%s) is older than go.mod requirement (go %s)", rawVer, reqVer),
				Remediation: fmt.Sprintf("Upgrade your Go compiler to >= %s or update GOTOOLCHAIN: 'go get go@%s'", reqVer, reqVer),
			}
		}
	}

	return CheckResult{
		Category: CategoryToolchain,
		Name:     "Go Compiler Version",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Compiler ready: %s", rawVer),
	}
}

// CheckStaticCrossCompilation tests CGO_ENABLED=0 static Linux binary generation capability.
func CheckStaticCrossCompilation(ctx context.Context) CheckResult {
	goPath, err := exec.LookPath("go")
	if err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Static Cross-Compilation",
			Status:      StatusFail,
			Message:     "Go binary not found",
			Remediation: "Ensure 'go' is installed and in PATH.",
		}
	}

	// Create a minimal dry-run scratch test
	tmpDir, err := os.MkdirTemp("", "anode-doctor-cgo-*")
	if err != nil {
		return CheckResult{
			Category: CategoryToolchain,
			Name:     "Static Cross-Compilation",
			Status:   StatusWarn,
			Message:  fmt.Sprintf("Could not create temp directory for cross-compile probe: %v", err),
		}
	}
	defer os.RemoveAll(tmpDir)

	scratchGo := filepath.Join(tmpDir, "main.go")
	src := []byte("package main\nfunc main() {}\n")
	if err := os.WriteFile(scratchGo, src, 0644); err != nil {
		return CheckResult{
			Category: CategoryToolchain,
			Name:     "Static Cross-Compilation",
			Status:   StatusWarn,
			Message:  fmt.Sprintf("Could not write scratch file for cross-compile probe: %v", err),
		}
	}

	outBin := filepath.Join(tmpDir, "scratch-linux")
	buildCmd := exec.CommandContext(ctx, goPath, "build", "-o", outBin, "main.go")
	buildCmd.Dir = tmpDir
	buildCmd.Env = append(os.Environ(),
		"CGO_ENABLED=0",
		"GOOS=linux",
		"GOARCH=amd64",
	)

	if out, err := buildCmd.CombinedOutput(); err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Static Cross-Compilation",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Cross-compile probe failed: %s (%v)", strings.TrimSpace(string(out)), err),
			Remediation: "Verify your Go toolchain allows GOOS=linux CGO_ENABLED=0 cross-compilation without C toolchain dependencies.",
		}
	}

	return CheckResult{
		Category: CategoryToolchain,
		Name:     "Static Cross-Compilation",
		Status:   StatusOK,
		Message:  "Linux static cross-compilation verified (GOOS=linux CGO_ENABLED=0)",
	}
}

// CheckGoModule validates the presence and readability of go.mod.
func CheckGoModule(targetDir string) CheckResult {
	modPath := filepath.Join(targetDir, "go.mod")
	data, err := os.ReadFile(modPath)
	if err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Go Module Contract",
			Status:      StatusWarn,
			Message:     fmt.Sprintf("No go.mod found in target directory (%s)", targetDir),
			Remediation: "Initialize a Go module: 'go mod init <module-name>' before running Anode.",
		}
	}

	moduleName := ""
	scanner := bufio.NewScanner(bytes.NewReader(data))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "module ") {
			moduleName = strings.TrimSpace(strings.TrimPrefix(line, "module"))
			break
		}
	}

	if moduleName == "" {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Go Module Contract",
			Status:      StatusFail,
			Message:     "go.mod exists but contains no valid 'module <name>' directive",
			Remediation: "Add a valid 'module' directive to go.mod.",
		}
	}

	return CheckResult{
		Category: CategoryToolchain,
		Name:     "Go Module Contract",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Valid module '%s' located at %s", moduleName, modPath),
	}
}

// CheckGitSanity verifies git repository presence and clean state.
func CheckGitSanity(ctx context.Context, targetDir string) CheckResult {
	cmd := exec.CommandContext(ctx, "git", "status", "--porcelain")
	cmd.Dir = targetDir
	out, err := cmd.CombinedOutput()
	if err != nil {
		return CheckResult{
			Category:    CategoryToolchain,
			Name:        "Git Version Control",
			Status:      StatusWarn,
			Message:     fmt.Sprintf("Target directory is not a git repository or git is missing: %v", err),
			Remediation: "Initialize git version control: 'git init' for commit-backed topology hashing.",
		}
	}

	dirtyCount := len(strings.Split(strings.TrimSpace(string(out)), "\n"))
	if strings.TrimSpace(string(out)) == "" {
		return CheckResult{
			Category: CategoryToolchain,
			Name:     "Git Version Control",
			Status:   StatusOK,
			Message:  "Git repository is clean (0 uncommitted files)",
		}
	}

	return CheckResult{
		Category: CategoryToolchain,
		Name:     "Git Version Control",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Git repository active (%d modified/untracked files)", dirtyCount),
	}
}

func extractGoModVersion(modPath string) (string, error) {
	data, err := os.ReadFile(modPath)
	if err != nil {
		return "", err
	}
	scanner := bufio.NewScanner(bytes.NewReader(data))
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if strings.HasPrefix(line, "go ") {
			return strings.TrimSpace(strings.TrimPrefix(line, "go")), nil
		}
	}
	return "", nil
}
