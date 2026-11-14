package doctor

import (
	"encoding/json"
	"os"
	"path/filepath"

	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/iag"
)

func CheckDeployInputs(targetDir string) CheckResult {
	data, err := os.ReadFile(filepath.Join(targetDir, "anode.lock.json"))
	if err != nil {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "Deploy Inputs",
			Status:      StatusWarn,
			Message:     "anode.lock.json not found, deploy inputs not checked",
			Remediation: "Run 'anode inspect' first.",
		}
	}
	var lockfile iag.LockFile
	if err := json.Unmarshal(data, &lockfile); err != nil {
		return CheckResult{
			Category: CategoryTopology,
			Name:     "Deploy Inputs",
			Status:   StatusFail,
			Message:  "anode.lock.json is not valid JSON",
		}
	}
	if err := deployer.DeployInputs(&lockfile, targetDir); err != nil {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "Deploy Inputs",
			Status:      StatusFail,
			Message:     err.Error(),
			Remediation: "Add the missing value to .env in the project folder.",
		}
	}
	return CheckResult{
		Category: CategoryTopology,
		Name:     "Deploy Inputs",
		Status:   StatusOK,
		Message:  ".env provides every secret, connection string, and Redis password the deploy needs",
	}
}
