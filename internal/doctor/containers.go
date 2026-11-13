package doctor

import (
	"context"
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"github.com/abhiudayg/anode/internal/iag"
)

// CheckContainerRuntime verifies whether ephemeral container runtimes are needed by the topology,
// and if so, tests Docker or Podman daemon reachability.
func CheckContainerRuntime(ctx context.Context, targetDir string) CheckResult {
	autoList, needsContainers := detectAutoProvisionedResources(targetDir)
	if !needsContainers {
		return CheckResult{
			Category: CategoryNetwork,
			Name:     "Ephemeral DB Runtime",
			Status:   StatusOK,
			Message:  "Not required (stateless architecture or direct database driver connections)",
		}
	}

	cli := ""
	if p, err := exec.LookPath("docker"); err == nil {
		cli = p
	} else if p, err := exec.LookPath("podman"); err == nil {
		cli = p
	}

	if cli == "" {
		return CheckResult{
			Category:    CategoryNetwork,
			Name:        "Ephemeral DB Runtime",
			Status:      StatusWarn,
			Message:     fmt.Sprintf("Auto-provisioned resources %v declared, but neither Docker nor Podman was found in PATH", autoList),
			Remediation: "Install Docker or Podman if you want automatic throwaway DBs during 'anode dev', or supply database connection strings in environment.",
		}
	}

	binName := "docker"
	if strings.Contains(cli, "podman") {
		binName = "podman"
	}

	// Ping daemon with a 2-second timeout
	pingCtx, cancel := context.WithTimeout(ctx, 2*time.Second)
	defer cancel()

	cmd := exec.CommandContext(pingCtx, binName, "info", "--format", "{{.ServerVersion}}")
	out, err := cmd.CombinedOutput()
	if err != nil {
		return CheckResult{
			Category:    CategoryNetwork,
			Name:        "Ephemeral DB Runtime",
			Status:      StatusWarn,
			Message:     fmt.Sprintf("Auto-provisioned resources %v declared, but %s daemon socket is stopped or unreachable", autoList, strings.Title(binName)),
			Remediation: fmt.Sprintf("Start your container engine (e.g. open Docker Desktop or '%s machine start') for 'anode dev' local databases.", binName),
		}
	}

	ver := strings.TrimSpace(string(out))
	if ver == "" {
		ver = "active"
	}

	return CheckResult{
		Category: CategoryNetwork,
		Name:     "Ephemeral DB Runtime",
		Status:   StatusOK,
		Message:  fmt.Sprintf("%s daemon reachable (v%s) — ready to host ephemeral %v for 'anode dev'", strings.Title(binName), ver, autoList),
	}
}

func detectAutoProvisionedResources(targetDir string) ([]string, bool) {
	lockPath := filepath.Join(targetDir, "anode.lock.json")
	data, err := os.ReadFile(lockPath)
	if err != nil {
		return nil, false
	}

	var lockfile iag.LockFile
	if err := json.Unmarshal(data, &lockfile); err != nil {
		return nil, false
	}

	var autoList []string
	for resID, res := range lockfile.Resources {
		if res.AutoProvision {
			autoList = append(autoList, fmt.Sprintf("%s (%s)", resID, res.Kind))
		}
	}

	return autoList, len(autoList) > 0
}
