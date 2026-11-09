package analyzer

import (
	"go/constant"
	"go/token"

	"golang.org/x/tools/go/ssa"
)

// TraceURL inspects URL values (e.g. cfg.PaymentService + "/v1/charges")
func TraceURL(val ssa.Value) (envVar string, routeSuffix string) {
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		envVar = TraceToEnvVar(binOp.X)
		routeSuffix = ResolveConstantString(binOp.Y)
		return envVar, routeSuffix
	}
	envVar = TraceToEnvVar(val)
	return envVar, ""
}

// TraceToEnvVar traces an SSA value backwards to an os.Getenv("VAR") call or struct field
func TraceToEnvVar(val ssa.Value) string {
	if val == nil {
		return ""
	}

	// 1. Direct call to os.Getenv("VAR")
	if call, ok := val.(*ssa.Call); ok {
		if callee := call.Common().StaticCallee(); callee != nil {
			if callee.Pkg != nil && callee.Pkg.Pkg != nil && callee.Pkg.Pkg.Path() == "os" && callee.Name() == "Getenv" {
				return ResolveConstantString(call.Common().Args[0])
			}
		}
	}

	// 2. Struct field access: cfg.Field
	// In Go SSA:
	// t0 = loadConfig()
	// t1 = &t0.Field [#index]
	// t2 = *t1 (t2 is ssa.UnOp MUL)
	if unOp, ok := val.(*ssa.UnOp); ok && unOp.Op == token.MUL {
		if fieldAddr, ok := unOp.X.(*ssa.FieldAddr); ok {
			return TraceFieldAddrSource(fieldAddr)
		}
	}

	// 3. String concatenation (e.g. ":" + cfg.Port)
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		left := TraceToEnvVar(binOp.X)
		if left != "" {
			return left
		}
		return TraceToEnvVar(binOp.Y)
	}

	// 4. Phi nodes across control-flow branches
	if phi, ok := val.(*ssa.Phi); ok {
		for _, edge := range phi.Edges {
			if env := TraceToEnvVar(edge); env != "" {
				return env
			}
		}
	}

	return ""
}

// TraceFieldAddrSource traces backward from a FieldAddr through its parent struct constructor
func TraceFieldAddrSource(fieldAddr *ssa.FieldAddr) string {
	structVal := fieldAddr.X
	fieldIdx := fieldAddr.Field

	// If structVal came from a constructor function call (e.g. loadConfig())
	if call, ok := structVal.(*ssa.Call); ok {
		callee := call.Common().StaticCallee()
		if callee != nil {
			for _, b := range callee.Blocks {
				for _, instr := range b.Instrs {
					if ret, ok := instr.(*ssa.Return); ok && len(ret.Results) > 0 {
						retVal := ret.Results[0]
						if alloc, ok := retVal.(*ssa.Alloc); ok {
							return FindStoreToField(alloc, fieldIdx)
						}
					}
				}
			}
		}
	}

	// If structVal is a local Alloc in the same function
	if alloc, ok := structVal.(*ssa.Alloc); ok {
		return FindStoreToField(alloc, fieldIdx)
	}

	return ""
}

// FindStoreToField searches referrers of an Alloc for writes to a specific field
func FindStoreToField(alloc *ssa.Alloc, fieldIdx int) string {
	if alloc.Referrers() == nil {
		return ""
	}
	for _, ref := range *alloc.Referrers() {
		if fa, ok := ref.(*ssa.FieldAddr); ok && fa.Field == fieldIdx {
			if fa.Referrers() != nil {
				for _, subRef := range *fa.Referrers() {
					if store, ok := subRef.(*ssa.Store); ok && store.Addr == fa {
						return TraceToEnvVar(store.Val)
					}
				}
			}
		}
	}
	return ""
}

// ResolveConstantString extracts the string literal value from an SSA constant
func ResolveConstantString(val ssa.Value) string {
	if c, ok := val.(*ssa.Const); ok && c.Value != nil && c.Value.Kind() == constant.String {
		return constant.StringVal(c.Value)
	}
	return ""
}
