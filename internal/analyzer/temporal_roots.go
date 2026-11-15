package analyzer

import (
	"golang.org/x/tools/go/ssa"
)

var temporalRegistrars = map[string]bool{
	"RegisterWorkflow":            true,
	"RegisterWorkflowWithOptions": true,
	"RegisterActivity":            true,
	"RegisterActivityWithOptions": true,
}

// temporalRegisteredFunctions returns the workflow and activity functions that the reachable code registers with a
// Temporal worker. The worker runs them later, so they are never called directly from main.
func temporalRegisteredFunctions(reachable map[*ssa.Function]bool) []*ssa.Function {
	var registered []*ssa.Function
	seen := make(map[*ssa.Function]bool)
	for fn := range reachable {
		for _, block := range fn.Blocks {
			for _, instr := range block.Instrs {
				call, ok := instr.(ssa.CallInstruction)
				if !ok || call.Common() == nil {
					continue
				}
				common := call.Common()
				if !temporalRegistrars[registrarName(common)] || len(common.Args) == 0 {
					continue
				}
				if target := functionValue(common.Args[0]); target != nil && !seen[target] {
					seen[target] = true
					registered = append(registered, target)
				}
			}
		}
	}
	return registered
}

func registrarName(common *ssa.CallCommon) string {
	if common.IsInvoke() {
		return common.Method.Name()
	}
	if callee := common.StaticCallee(); callee != nil {
		return callee.Name()
	}
	return ""
}

// functionValue unwraps an argument passed as an interface{} to the *ssa.Function it holds.
func functionValue(val ssa.Value) *ssa.Function {
	if mi, ok := val.(*ssa.MakeInterface); ok {
		val = mi.X
	}
	fn, _ := val.(*ssa.Function)
	return fn
}
