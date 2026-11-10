package analyzer

import (
	"go/constant"
	"go/token"
	"strings"

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

// TraceCompositeEnvVars collects multiple env vars if a string was built using fmt.Sprintf or concatenation
func TraceCompositeEnvVars(val ssa.Value) []string {
	var results []string
	seen := make(map[string]bool)

	var walk func(v ssa.Value)
	walk = func(v ssa.Value) {
		if v == nil {
			return
		}
		// Direct env var
		if env := TraceToEnvVar(v); env != "" {
			if !seen[env] {
				seen[env] = true
				results = append(results, env)
			}
			return
		}

		// Function calls like fmt.Sprintf
		if call, ok := v.(*ssa.Call); ok {
			for _, arg := range call.Common().Args {
				walk(arg)
			}
		}

		// Binary operations
		if binOp, ok := v.(*ssa.BinOp); ok {
			walk(binOp.X)
			walk(binOp.Y)
		}

		// Slice allocation for varargs (e.g. fmt.Sprintf args)
		if slice, ok := v.(*ssa.Slice); ok {
			walk(slice.X)
		}
	}

	walk(val)
	return results
}

// TraceToEnvVar traces an SSA value backwards to an os.Getenv("VAR") call or struct field
func TraceToEnvVar(val ssa.Value) string {
	if val == nil {
		return ""
	}

	// 1. Direct call to os.Getenv("VAR") or os.LookupEnv("VAR")
	if call, ok := val.(*ssa.Call); ok {
		if callee := call.Common().StaticCallee(); callee != nil {
			if callee.Pkg != nil && callee.Pkg.Pkg != nil && callee.Pkg.Pkg.Path() == "os" {
				if callee.Name() == "Getenv" || callee.Name() == "LookupEnv" {
					return ResolveConstantString(call.Common().Args[0])
				}
			}
		}
	}

	// 2. Struct field access: cfg.Field
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

	// 4. Type conversions or interface wrappers (ssa.ChangeType, ssa.MakeInterface)
	if change, ok := val.(*ssa.ChangeType); ok {
		return TraceToEnvVar(change.X)
	}
	if makeIface, ok := val.(*ssa.MakeInterface); ok {
		return TraceToEnvVar(makeIface.X)
	}

	// 5. Phi nodes across control-flow branches
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

// IsExternalURL returns true if the URL points to a public external domain (e.g. stripe.com, twilio.com)
func IsExternalURL(rawURL string) bool {
	lower := strings.ToLower(rawURL)
	return strings.HasPrefix(lower, "https://") ||
		strings.Contains(lower, "stripe.com") ||
		strings.Contains(lower, "twilio.com") ||
		strings.Contains(lower, "sendgrid.com") ||
		strings.Contains(lower, "amazonaws.com")
}
