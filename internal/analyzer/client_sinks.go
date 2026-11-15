package analyzer

import (
	"strings"

	"golang.org/x/tools/go/ssa"

	"github.com/abhiudayg/anode/internal/iag"
)

// clientSink describes one store client constructor. The connection value comes from argument argIndex, read
// either directly or from the struct field named by field.
type clientSink struct {
	pkgContains string
	funcName    string
	kind        string
	protocol    string
	argIndex    int
	field       string
	// chainedMethod names a method on the argument that carries the connection string, as in
	// mongo.Connect(options.Client().ApplyURI(uri)).
	chainedMethod string
}

var clientSinks = []clientSink{
	{pkgContains: "rabbitmq/amqp091-go", funcName: "Dial", kind: "rabbitmq", protocol: "amqp"},
	{pkgContains: "minio/minio-go", funcName: "New", kind: "minio", protocol: "s3"},
	{pkgContains: "gomemcache/memcache", funcName: "New", kind: "memcached", protocol: "memcached"},
	{pkgContains: "gocql/gocql", funcName: "NewCluster", kind: "scylladb", protocol: "cql"},
	{pkgContains: "temporal.io/sdk/client", funcName: "Dial", kind: "temporal", protocol: "temporal", field: "HostPort"},
	{pkgContains: "ClickHouse/clickhouse-go", funcName: "Open", kind: "clickhouse", protocol: "clickhouse", field: "Addr"},
	{pkgContains: "mongo-driver/v2/mongo", funcName: "Connect", kind: "mongodb", protocol: "mongodb", chainedMethod: "ApplyURI"},
}

var clientEnvSuffixes = []string{"_URL", "_URI", "_DSN", "_ADDR", "_ENDPOINT", "_HOSTS", "_ADDRS", "_HOST_PORT"}

// inspectClientSink records a binding for a store client constructor. It reports whether the call matched.
func (s *SinkInspector) inspectClientSink(pkgPath, name string, call *ssa.CallCommon, svc *iag.Service, graph *iag.Graph, provenance string) bool {
	for _, sink := range clientSinks {
		if !strings.Contains(pkgPath, sink.pkgContains) || name != sink.funcName || len(call.Args) <= sink.argIndex {
			continue
		}
		arg := call.Args[sink.argIndex]
		if sl, ok := arg.(*ssa.Slice); ok {
			if alloc, ok := sl.X.(*ssa.Alloc); ok {
				arg = variadicElementValue(alloc)
			}
		}
		if sink.chainedMethod != "" {
			arg = chainedArgument(arg, sink.chainedMethod)
		}
		envVar := ""
		if sink.field != "" {
			envVar = TraceStructFieldEnvVar(arg, sink.field)
		} else {
			envVar = TraceToEnvVar(arg)
		}
		resourceID := sink.kind + "-" + svc.Name
		if envVar != "" {
			resourceID = resourceIDFromEnv(envVar)
		}
		if _, exists := graph.Resources[resourceID]; !exists {
			graph.Resources[resourceID] = iag.Resource{
				Kind:       iag.ResourceKind(sink.kind),
				Lifecycle:  iag.LifecycleStatefulRetain,
				Provenance: provenance,
			}
		}
		svc.Bindings = append(svc.Bindings, iag.Binding{
			ResourceRef: resourceID,
			Protocol:    sink.protocol,
			InjectEnv:   envVar,
			Provenance:  provenance,
		})
		return true
	}
	return false
}

// chainedArgument returns the argument of a method call such as options.Client().ApplyURI(uri), or the value itself.
func chainedArgument(val ssa.Value, method string) ssa.Value {
	call, ok := val.(*ssa.Call)
	if !ok || call.Call.StaticCallee() == nil || call.Call.StaticCallee().Name() != method || len(call.Call.Args) < 2 {
		return val
	}
	return call.Call.Args[1]
}

func resourceIDFromEnv(envVar string) string {
	cleaned := strings.ToLower(envVar)
	for _, suffix := range clientEnvSuffixes {
		cleaned = strings.TrimSuffix(cleaned, strings.ToLower(suffix))
	}
	return strings.ReplaceAll(cleaned, "_", "-")
}

// variadicElementValue returns the value stored into the first element of a packed variadic array.
func variadicElementValue(alloc *ssa.Alloc) ssa.Value {
	if alloc.Referrers() == nil {
		return nil
	}
	for _, ref := range *alloc.Referrers() {
		index, ok := ref.(*ssa.IndexAddr)
		if !ok || index.Referrers() == nil {
			continue
		}
		for _, elemRef := range *index.Referrers() {
			if store, ok := elemRef.(*ssa.Store); ok && store.Addr == index {
				return store.Val
			}
		}
	}
	return nil
}

// providerFallbackURL returns the literal fallback URL of a call such as providerURL(env, base, path), which builds an
// external endpoint from an env override and a literal base. It returns "" for any other value.
func providerFallbackURL(val ssa.Value) string {
	call, ok := val.(*ssa.Call)
	if !ok || call.Call.StaticCallee() == nil || call.Call.StaticCallee().Name() != "providerURL" || len(call.Call.Args) != 3 {
		return ""
	}
	base := ResolveConstantString(call.Call.Args[1])
	path := ResolveConstantString(call.Call.Args[2])
	if base == "" {
		return ""
	}
	return base + path
}
