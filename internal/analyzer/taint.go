package analyzer

import (
	"go/constant"
	"go/token"
	"go/types"
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

	var walk func(v ssa.Value, paramEnv map[*ssa.Parameter]string)
	walk = func(v ssa.Value, paramEnv map[*ssa.Parameter]string) {
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

		// Function calls (fmt.Sprintf, or user config DSN methods like (*DatabaseConfig).DSN())
		if call, ok := v.(*ssa.Call); ok {
			if callee := call.Common().StaticCallee(); callee != nil {
				if callee.Pkg != nil && callee.Pkg.Pkg != nil && !isStdlib(callee.Pkg.Pkg.Path()) {
					newParamEnv := make(map[*ssa.Parameter]string)
					for k, val := range paramEnv {
						newParamEnv[k] = val
					}
					for i, param := range callee.Params {
						if i < len(call.Common().Args) {
							str := ResolveStringWithParams(call.Common().Args[i], paramEnv)
							if str != "" {
								newParamEnv[param] = str
							}
						}
					}

					// Inspect user function returns and instructions
					for _, b := range callee.Blocks {
						for _, instr := range b.Instrs {
							if ret, ok := instr.(*ssa.Return); ok {
								for _, res := range ret.Results {
									walk(res, newParamEnv)
								}
							}
							if subCall, ok := instr.(ssa.CallInstruction); ok {
								if subCommon := subCall.Common(); subCommon != nil {
									if subCallee := subCommon.StaticCallee(); subCallee != nil {
										if subCallee.Pkg != nil && subCallee.Pkg.Pkg != nil &&
											subCallee.Pkg.Pkg.Path() == "os" &&
											(subCallee.Name() == "Getenv" || subCallee.Name() == "LookupEnv") &&
											len(subCommon.Args) > 0 {
											envName := ResolveStringWithParams(subCommon.Args[0], newParamEnv)
											if envName != "" && !seen[envName] && !strings.Contains(envName, "PORT") {
												seen[envName] = true
												results = append(results, envName)
											}
										}
									}
								}
							}
						}
					}
					for _, arg := range call.Common().Args {
						walk(arg, newParamEnv)
					}
					return
				}
			}

			for _, arg := range call.Common().Args {
				walk(arg, paramEnv)
			}
		}

		// Binary operations (e.g. string concatenation)
		if binOp, ok := v.(*ssa.BinOp); ok {
			walk(binOp.X, paramEnv)
			walk(binOp.Y, paramEnv)
		}

		// Slice allocation for varargs (e.g. fmt.Sprintf args)
		if slice, ok := v.(*ssa.Slice); ok {
			walk(slice.X, paramEnv)
		}

		// Array/slice backing allocation for varargs
		if alloc, ok := v.(*ssa.Alloc); ok {
			if alloc.Referrers() != nil {
				for _, ref := range *alloc.Referrers() {
					if ia, ok := ref.(*ssa.IndexAddr); ok {
						if ia.Referrers() != nil {
							for _, subRef := range *ia.Referrers() {
								if store, ok := subRef.(*ssa.Store); ok && store.Addr == ia {
									walk(store.Val, paramEnv)
								}
							}
						}
					}
				}
			}
		}

		// MakeInterface unwrapping
		if mi, ok := v.(*ssa.MakeInterface); ok {
			walk(mi.X, paramEnv)
		}

		// FieldAddr or UnOp dereference (e.g. cfg.Database)
		if fa, ok := v.(*ssa.FieldAddr); ok {
			walk(fa.X, paramEnv)
		}
		if unOp, ok := v.(*ssa.UnOp); ok {
			walk(unOp.X, paramEnv)
		}
	}

	walk(val, nil)
	return results
}

// TraceToEnvVar traces an SSA value backwards to an os.Getenv("VAR") call or struct field
func TraceToEnvVar(val ssa.Value) string {
	visited := make(map[ssa.Value]bool)
	return traceToEnvVarWithDepth(val, visited, 0)
}

func traceToEnvVarWithDepth(val ssa.Value, visited map[ssa.Value]bool, depth int) string {
	if val == nil || depth > 25 || visited[val] {
		return ""
	}
	visited[val] = true

	// 1. Direct call to os.Getenv("VAR") or os.LookupEnv("VAR")
	if call, ok := val.(*ssa.Call); ok {
		if callee := call.Common().StaticCallee(); callee != nil {
			if callee.Pkg != nil && callee.Pkg.Pkg != nil && callee.Pkg.Pkg.Path() == "os" {
				if callee.Name() == "Getenv" || callee.Name() == "LookupEnv" {
					if len(call.Common().Args) > 0 {
						return ResolveStringValue(call.Common().Args[0])
					}
				}
			}
		}
	}

	// 2. FreeVar captured in closure: e.g. paymentsAddr captured in http handler closure
	if fv, ok := val.(*ssa.FreeVar); ok {
		return TraceCapturedVar(fv)
	}

	// 3. Pointer dereference: cfg.Field or *capturedVar in closures
	if unOp, ok := val.(*ssa.UnOp); ok && unOp.Op == token.MUL {
		if fieldAddr, ok := unOp.X.(*ssa.FieldAddr); ok {
			return TraceFieldAddrSource(fieldAddr)
		}
		if fv, ok := unOp.X.(*ssa.FreeVar); ok {
			return TraceCapturedVar(fv)
		}
		if alloc, ok := unOp.X.(*ssa.Alloc); ok {
			return FindStoreToAlloc(alloc)
		}
	}

	// 4. String concatenation (e.g. ":" + cfg.Port)
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		left := traceToEnvVarWithDepth(binOp.X, visited, depth+1)
		if left != "" {
			return left
		}
		return traceToEnvVarWithDepth(binOp.Y, visited, depth+1)
	}

	// 5. Type conversions or interface wrappers (ssa.ChangeType, ssa.MakeInterface)
	if change, ok := val.(*ssa.ChangeType); ok {
		return traceToEnvVarWithDepth(change.X, visited, depth+1)
	}
	if makeIface, ok := val.(*ssa.MakeInterface); ok {
		return traceToEnvVarWithDepth(makeIface.X, visited, depth+1)
	}

	// 6. Phi nodes across control-flow branches
	if phi, ok := val.(*ssa.Phi); ok {
		for _, edge := range phi.Edges {
			if env := traceToEnvVarWithDepth(edge, visited, depth+1); env != "" {
				return env
			}
		}
	}

	return ""
}

// TraceCapturedVar traces a FreeVar captured in a closure back to its outer store
func TraceCapturedVar(fv *ssa.FreeVar) string {
	parent := fv.Parent()
	if parent == nil {
		return ""
	}
	fvIdx := -1
	for i, f := range parent.FreeVars {
		if f == fv {
			fvIdx = i
			break
		}
	}
	if fvIdx < 0 {
		return ""
	}

	var boundVal ssa.Value
	if parent.Referrers() != nil {
		for _, ref := range *parent.Referrers() {
			if mc, ok := ref.(*ssa.MakeClosure); ok && fvIdx < len(mc.Bindings) {
				boundVal = mc.Bindings[fvIdx]
				break
			}
		}
	}
	if boundVal == nil && parent.Pkg != nil {
		for _, mem := range parent.Pkg.Members {
			if fn, ok := mem.(*ssa.Function); ok {
				for _, b := range fn.Blocks {
					for _, instr := range b.Instrs {
						if mc, ok := instr.(*ssa.MakeClosure); ok && mc.Fn == parent && fvIdx < len(mc.Bindings) {
							boundVal = mc.Bindings[fvIdx]
							break
						}
					}
					if boundVal != nil {
						break
					}
				}
			}
			if boundVal != nil {
				break
			}
		}
	}

	if boundVal == nil {
		return ""
	}

	if env := TraceToEnvVar(boundVal); env != "" {
		return env
	}
	if alloc, ok := boundVal.(*ssa.Alloc); ok {
		return FindStoreToAlloc(alloc)
	}
	return ""
}

// FindStoreToAlloc searches referrers of an Alloc for writes to it
func FindStoreToAlloc(alloc *ssa.Alloc) string {
	if alloc.Referrers() == nil {
		return ""
	}
	for _, ref := range *alloc.Referrers() {
		if store, ok := ref.(*ssa.Store); ok && store.Addr == alloc {
			if env := TraceToEnvVar(store.Val); env != "" {
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

	// If structVal is a parameter of a method (e.g. d *DatabaseConfig in DSN())
	if param, ok := structVal.(*ssa.Parameter); ok {
		parent := param.Parent()
		if parent != nil && parent.Referrers() != nil {
			paramIdx := -1
			for i, p := range parent.Params {
				if p == param {
					paramIdx = i
					break
				}
			}
			if paramIdx >= 0 {
				for _, ref := range *parent.Referrers() {
					if call, ok := ref.(*ssa.Call); ok && paramIdx < len(call.Common().Args) {
						argVal := call.Common().Args[paramIdx]
						if subFA, ok := argVal.(*ssa.FieldAddr); ok {
							if env := TraceNestedFieldAddr(subFA, fieldIdx); env != "" {
								return env
							}
						} else if alloc, ok := argVal.(*ssa.Alloc); ok {
							return FindStoreToField(alloc, fieldIdx)
						}
					}
				}
			}
		}
	}

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

	// If structVal is a nested FieldAddr (e.g. cfg.Database.User)
	if parentFA, ok := structVal.(*ssa.FieldAddr); ok {
		return TraceNestedFieldAddr(parentFA, fieldIdx)
	}

	return ""
}

// TraceNestedFieldAddr traces stores into a nested field (e.g. cfg.Database.User)
func TraceNestedFieldAddr(parentFA *ssa.FieldAddr, subFieldIdx int) string {
	structVal := parentFA.X
	parentFieldIdx := parentFA.Field

	var alloc *ssa.Alloc
	if call, ok := structVal.(*ssa.Call); ok {
		callee := call.Common().StaticCallee()
		if callee != nil {
			for _, b := range callee.Blocks {
				for _, instr := range b.Instrs {
					if ret, ok := instr.(*ssa.Return); ok && len(ret.Results) > 0 {
						if a, ok := ret.Results[0].(*ssa.Alloc); ok {
							alloc = a
							break
						}
					}
				}
			}
		}
	} else if a, ok := structVal.(*ssa.Alloc); ok {
		alloc = a
	}

	if alloc == nil || alloc.Referrers() == nil {
		return ""
	}

	for _, ref := range *alloc.Referrers() {
		if fa, ok := ref.(*ssa.FieldAddr); ok && fa.Field == parentFieldIdx {
			if fa.Referrers() != nil {
				for _, subRef := range *fa.Referrers() {
					if subFA, ok := subRef.(*ssa.FieldAddr); ok && subFA.Field == subFieldIdx {
						if subFA.Referrers() != nil {
							for _, storeRef := range *subFA.Referrers() {
								if store, ok := storeRef.(*ssa.Store); ok && store.Addr == subFA {
									return TraceToEnvVar(store.Val)
								}
							}
						}
					}
				}
			}
		}
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

// TraceStructFieldEnvVar inspects a struct allocation or pointer for an env var assigned to a named field (e.g. Addr in redis.Options)
func TraceStructFieldEnvVar(val ssa.Value, targetField string) string {
	if val == nil {
		return ""
	}
	if env := TraceToEnvVar(val); env != "" {
		return env
	}
	if mi, ok := val.(*ssa.MakeInterface); ok {
		return TraceStructFieldEnvVar(mi.X, targetField)
	}
	if ct, ok := val.(*ssa.ChangeType); ok {
		return TraceStructFieldEnvVar(ct.X, targetField)
	}
	if unOp, ok := val.(*ssa.UnOp); ok && unOp.Op == token.MUL {
		return TraceStructFieldEnvVar(unOp.X, targetField)
	}

	if alloc, ok := val.(*ssa.Alloc); ok {
		if alloc.Referrers() != nil {
			for _, ref := range *alloc.Referrers() {
				if fa, ok := ref.(*ssa.FieldAddr); ok {
					ptrType, ok := fa.X.Type().(*types.Pointer)
					if ok {
						if st, ok := ptrType.Elem().Underlying().(*types.Struct); ok {
							if fa.Field >= 0 && fa.Field < st.NumFields() {
								fieldName := st.Field(fa.Field).Name()
								if targetField == "" || strings.EqualFold(fieldName, targetField) {
									if fa.Referrers() != nil {
										for _, subRef := range *fa.Referrers() {
											if store, ok := subRef.(*ssa.Store); ok && store.Addr == fa {
												if env := TraceToEnvVar(store.Val); env != "" {
													return env
												}
											}
										}
									}
								}
							}
						}
					}
				}
			}
		}
	}
	return ""
}

// ResolveStringValue resolves string constants or concatenations, including parameter resolution
func ResolveStringValue(val ssa.Value) string {
	if val == nil {
		return ""
	}
	if c, ok := val.(*ssa.Const); ok && c.Value != nil && c.Value.Kind() == constant.String {
		return constant.StringVal(c.Value)
	}
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		left := ResolveStringValue(binOp.X)
		right := ResolveStringValue(binOp.Y)
		if left != "" && right != "" {
			return left + right
		}
		if left != "" {
			return left
		}
		return right
	}
	if param, ok := val.(*ssa.Parameter); ok {
		parent := param.Parent()
		if parent != nil && parent.Referrers() != nil {
			paramIdx := -1
			for i, p := range parent.Params {
				if p == param {
					paramIdx = i
					break
				}
			}
			if paramIdx >= 0 {
				for _, ref := range *parent.Referrers() {
					if call, ok := ref.(*ssa.Call); ok && paramIdx < len(call.Common().Args) {
						str := ResolveStringValue(call.Common().Args[paramIdx])
						if str != "" {
							return str
						}
					}
				}
			}
		}
	}
	return ""
}

// ResolveStringWithParams resolves strings using an active parameter mapping
func ResolveStringWithParams(val ssa.Value, paramEnv map[*ssa.Parameter]string) string {
	if val == nil {
		return ""
	}
	if c, ok := val.(*ssa.Const); ok && c.Value != nil && c.Value.Kind() == constant.String {
		return constant.StringVal(c.Value)
	}
	if binOp, ok := val.(*ssa.BinOp); ok && binOp.Op == token.ADD {
		left := ResolveStringWithParams(binOp.X, paramEnv)
		right := ResolveStringWithParams(binOp.Y, paramEnv)
		if left != "" && right != "" {
			return left + right
		}
		if left != "" {
			return left
		}
		return right
	}
	if param, ok := val.(*ssa.Parameter); ok {
		if paramEnv != nil {
			if s, ok := paramEnv[param]; ok && s != "" {
				return s
			}
		}
		return ResolveStringValue(param)
	}
	return ResolveStringValue(val)
}

// ResolveConstantString extracts the string literal value from an SSA constant
func ResolveConstantString(val ssa.Value) string {
	return ResolveStringValue(val)
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

var stdlibRoots = map[string]bool{
	"archive": true, "bufio": true, "builtin": true, "bytes": true,
	"compress": true, "container": true, "context": true, "crypto": true,
	"database": true, "debug": true, "embed": true, "encoding": true,
	"errors": true, "expvar": true, "flag": true, "fmt": true,
	"go": true, "hash": true, "html": true, "image": true,
	"index": true, "internal": true, "io": true, "log": true,
	"math": true, "mime": true, "net": true, "os": true,
	"path": true, "plugin": true, "reflect": true, "regexp": true,
	"runtime": true, "sort": true, "strconv": true, "strings": true,
	"sync": true, "syscall": true, "testing": true, "text": true,
	"time": true, "unicode": true, "unsafe": true,
}

func isStdlib(pkgPath string) bool {
	if pkgPath == "" {
		return false
	}
	root := strings.Split(pkgPath, "/")[0]
	return stdlibRoots[root]
}
