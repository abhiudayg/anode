package doctor

import (
	"context"
	"fmt"
)

// Run executes all pre-flight and topology sanity checks based on the provided Options.
func Run(ctx context.Context, opts Options) (*Report, error) {
	report := &Report{
		Strict: opts.Strict,
	}

	targetDir := opts.TargetDir
	if targetDir == "" {
		targetDir = "."
	}

	// Pillar 1: Toolchain & Compiler
	report.Add(CheckGoCompiler(ctx, targetDir))
	report.Add(CheckStaticCrossCompilation(ctx))
	report.Add(CheckGoModule(targetDir))
	report.Add(CheckGitSanity(ctx, targetDir))

	// Pillar 2 & 3: Local Runtime, Network & Containers
	report.Add(CheckLoopbackAllocation())
	report.Add(CheckCommonDevPorts())
	report.Add(CheckContainerRuntime(ctx, targetDir))

	// Pillar 4: Topology & Contract Integrity
	report.Add(CheckTopologyAnalysis(targetDir))
	report.Add(CheckLockfileContract(targetDir))
	report.Add(CheckMigrationAssets(targetDir))

	// Local SSH keys
	report.Add(CheckLocalSSHKeys())

	// Pillar 5: Remote VPS Pre-Flight (if remote target specified)
	if opts.RemoteTarget != "" {
		remoteResults := CheckRemoteTarget(ctx, opts.RemoteTarget)
		for _, res := range remoteResults {
			report.Add(res)
		}
	}

	return report, nil
}

// PrintReport writes the formatted diagnostic findings to stdout.
func PrintReport(report *Report, remoteTarget string) {
	fmt.Println("🏥 Anode Doctor — Pre-Flight & Topology Diagnostics")
	fmt.Println("==================================================")

	currentCategory := ""
	for _, res := range report.Results {
		if res.Category != currentCategory {
			currentCategory = res.Category
			title := currentCategory
			if currentCategory == CategoryRemote && remoteTarget != "" {
				title = fmt.Sprintf("%s (target: %s)", currentCategory, remoteTarget)
			}
			fmt.Printf("\n[%s]\n", title)
		}

		symbol := "✓"
		switch res.Status {
		case StatusOK:
			symbol = "  ✓"
		case StatusWarn:
			symbol = "  ⚠"
		case StatusFail:
			symbol = "  ❌"
		}

		fmt.Printf("%s %s: %s\n", symbol, res.Name, res.Message)
		if res.Remediation != "" && res.Status != StatusOK {
			fmt.Printf("     💡 Fix: %s\n", res.Remediation)
		}
	}

	fmt.Println("\n--------------------------------------------------")
	fmt.Printf("Diagnostics summary: %d passed, %d warning(s), %d error(s)\n",
		report.TotalPassed, report.TotalWarned, report.TotalFailed)

	if report.HasFailed() {
		if report.TotalFailed > 0 {
			fmt.Println("❌ Critical pre-flight diagnostics failed. Please resolve above issues.")
		} else if report.Strict && report.TotalWarned > 0 {
			fmt.Println("❌ Strict mode active: warnings treated as fatal errors.")
		}
	} else {
		if report.TotalWarned > 0 {
			fmt.Println("✅ System is operational with minor notices. Ready for Anode dev & deploy.")
		} else {
			fmt.Println("✅ All invariants satisfied. System is 100% ready for Anode dev & deploy.")
		}
	}
}
