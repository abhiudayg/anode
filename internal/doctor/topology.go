package doctor

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/abhiudayg/anode/internal/analyzer"
	"github.com/abhiudayg/anode/internal/iag"
)

const CategoryTopology = "TOPOLOGY & CONTRACT"

// CheckTopologyAnalysis runs a fast whole-program SSA analysis probe on the target directory.
func CheckTopologyAnalysis(targetDir string) CheckResult {
	loader := analyzer.NewLoader(targetDir)
	lockfile, err := loader.LoadAndAnalyze("./...")
	if err != nil {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "AST Whole-Program Analysis",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Failed to traverse Go source code: %v", err),
			Remediation: "Ensure your Go source compiles without syntax errors: 'go build ./...' before running Anode.",
		}
	}

	svcCount := len(lockfile.Services)
	resCount := len(lockfile.Resources)

	// Check if any error-level compiler diagnostics exist
	var errDiags []string
	for _, d := range lockfile.Diagnostics {
		if d.Level == "error" {
			errDiags = append(errDiags, fmt.Sprintf("%s (%s)", d.Message, d.Provenance))
		}
	}

	if len(errDiags) > 0 {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "AST Whole-Program Analysis",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Analysis identified fatal topology diagnostics: %v", errDiags),
			Remediation: "Resolve detected database connection string or port binding errors in your Go code.",
		}
	}

	return CheckResult{
		Category: CategoryTopology,
		Name:     "AST Whole-Program Analysis",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Topology parsed successfully (%d service(s), %d stateful resource(s))", svcCount, resCount),
	}
}

// CheckLockfileContract inspects the presence and integrity of anode.lock.json.
func CheckLockfileContract(targetDir string) CheckResult {
	lockPath := filepath.Join(targetDir, "anode.lock.json")
	data, err := os.ReadFile(lockPath)
	if err != nil {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "Contract Verification",
			Status:      StatusWarn,
			Message:     "anode.lock.json not found in target directory",
			Remediation: "Run 'anode inspect' to synthesize and seal the deterministic topology contract.",
		}
	}

	var lockfile iag.LockFile
	if err := json.Unmarshal(data, &lockfile); err != nil {
		return CheckResult{
			Category:    CategoryTopology,
			Name:        "Contract Verification",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Corrupted anode.lock.json: %v", err),
			Remediation: "Regenerate the contract with 'anode inspect'.",
		}
	}

	sum := sha256.Sum256(data)
	hashShort := hex.EncodeToString(sum[:])
	if len(hashShort) > 8 {
		hashShort = hashShort[:8]
	}

	return CheckResult{
		Category: CategoryTopology,
		Name:     "Contract Verification",
		Status:   StatusOK,
		Message:  fmt.Sprintf("anode.lock.json valid (SHA256: %s..., %d services, %d resources)", hashShort, len(lockfile.Services), len(lockfile.Resources)),
	}
}

// CheckMigrationAssets checks if declared database migration assets exist on disk.
func CheckMigrationAssets(targetDir string) CheckResult {
	lockPath := filepath.Join(targetDir, "anode.lock.json")
	data, err := os.ReadFile(lockPath)
	if err != nil {
		return CheckResult{
			Category: CategoryTopology,
			Name:     "Schema Migrations",
			Status:   StatusOK,
			Message:  "Skipping migration asset check (no anode.lock.json present)",
		}
	}

	var lockfile iag.LockFile
	if err := json.Unmarshal(data, &lockfile); err != nil {
		return CheckResult{
			Category: CategoryTopology,
			Name:     "Schema Migrations",
			Status:   StatusOK,
			Message:  "Skipping migration check on unparseable lockfile",
		}
	}

	foundAny := false
	for resID, res := range lockfile.Resources {
		if res.Migrations == nil || res.Migrations.Path == "" {
			continue
		}
		foundAny = true
		migDir := filepath.Join(targetDir, res.Migrations.Path)
		entries, err := os.ReadDir(migDir)
		if err != nil {
			return CheckResult{
				Category:    CategoryTopology,
				Name:        "Schema Migrations",
				Status:      StatusFail,
				Message:     fmt.Sprintf("Migration directory for resource '%s' not found at %s: %v", resID, migDir, err),
				Remediation: fmt.Sprintf("Create directory '%s' or adjust your SQL migration directory path.", res.Migrations.Path),
			}
		}

		sqlCount := 0
		for _, e := range entries {
			if !e.IsDir() && filepath.Ext(e.Name()) == ".sql" {
				sqlCount++
			}
		}

		if sqlCount == 0 {
			return CheckResult{
				Category:    CategoryTopology,
				Name:        "Schema Migrations",
				Status:      StatusWarn,
				Message:     fmt.Sprintf("Migration directory for '%s' exists (%s) but contains 0 .sql files", resID, res.Migrations.Path),
				Remediation: "Add versioned Goose/Golang-Migrate SQL schema files (e.g., 001_init.sql).",
			}
		}
	}

	if !foundAny {
		return CheckResult{
			Category: CategoryTopology,
			Name:     "Schema Migrations",
			Status:   StatusOK,
			Message:  "Zero migration dependencies declared; pure stateless or direct driver bindings",
		}
	}

	return CheckResult{
		Category: CategoryTopology,
		Name:     "Schema Migrations",
		Status:   StatusOK,
		Message:  "All schema migration directories and SQL assets verified",
	}
}
