package analyzer

import (
	"go/types"
	"sort"
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

var clientEnvSuffixes = []string{"_URL", "_URI", "_DSN", "_ADDR", "_ENDPOINT", "_HOSTS", "_ADDRS", "_HOST_PORT", "_BROKERS"}

// storeKindByEnvMarker maps an env var name fragment to the store kind it names, for stores reached over plain HTTP.
var storeKindByEnvMarker = map[string]string{"QDRANT": "qdrant"}

func storeKindFromEnv(envVar string) string {
	for marker, kind := range storeKindByEnvMarker {
		if strings.Contains(strings.ToUpper(envVar), marker) {
			return kind
		}
	}
	return ""
}

func ensureResource(graph *iag.Graph, id, kind, provenance string) {
	if _, exists := graph.Resources[id]; !exists {
		graph.Resources[id] = iag.Resource{
			Kind:          iag.ResourceKind(kind),
			Lifecycle:     iag.LifecycleStatefulRetain,
			AutoProvision: true,
			Provenance:    provenance,
		}
	}
}

// InspectStore records a kafka.Writer whose Addr field is set from a broker list, as in
// &kafka.Writer{Addr: kafka.TCP(splitHosts(os.Getenv("...")))...}.
func (s *SinkInspector) InspectStore(store *ssa.Store, svc *iag.Service, graph *iag.Graph) {
	fa, ok := store.Addr.(*ssa.FieldAddr)
	if !ok || !isKafkaWriterField(fa, "Addr") {
		return
	}
	call, ok := store.Val.(*ssa.Call)
	if !ok || call.Call.StaticCallee() == nil || call.Call.StaticCallee().Name() != "TCP" || len(call.Call.Args) == 0 {
		return
	}
	envVar := TraceToEnvVar(call.Call.Args[0])
	if envVar == "" {
		return
	}
	provenance := s.FormatPos(store.Pos())
	id := resourceIDFromEnv(envVar)
	ensureResource(graph, id, "kafka", provenance)
	svc.Bindings = append(svc.Bindings, iag.Binding{
		ResourceRef: id,
		Protocol:    "kafka",
		InjectEnv:   envVar,
		Provenance:  provenance,
	})
}

func isKafkaWriterField(fa *ssa.FieldAddr, field string) bool {
	ptr, ok := fa.X.Type().(*types.Pointer)
	if !ok {
		return false
	}
	named, ok := ptr.Elem().(*types.Named)
	if !ok || named.Obj().Name() != "Writer" || named.Obj().Pkg() == nil || !strings.Contains(named.Obj().Pkg().Path(), "segmentio/kafka-go") {
		return false
	}
	st, ok := named.Underlying().(*types.Struct)
	return ok && st.Field(fa.Field).Name() == field
}

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
		ensureResource(graph, resourceID, sink.kind, provenance)
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

func bindStoreOverHTTP(svc *iag.Service, graph *iag.Graph, envVar, kind, routeSuffix, provenance string) {
	id := resourceIDFromEnv(envVar)
	ensureResource(graph, id, kind, provenance)
	for _, b := range svc.Bindings {
		if b.ResourceRef == id && b.InjectEnv == envVar && b.Interface == routeSuffix {
			return
		}
	}
	svc.Bindings = append(svc.Bindings, iag.Binding{
		ResourceRef: id,
		Protocol:    "http",
		Interface:   routeSuffix,
		InjectEnv:   envVar,
		Provenance:  provenance,
	})
}

func (s *SinkInspector) InspectKafkaTopic(store *ssa.Store, svc *iag.Service) {
	fa, ok := store.Addr.(*ssa.FieldAddr)
	if !ok || !isKafkaWriterField(fa, "Topic") {
		return
	}
	if topic := ResolveConstantString(store.Val); topic != "" {
		svc.Topics = appendUnique(svc.Topics, topic)
	}
}

var minioBucketMethods = map[string]bool{
	"PutObject": true, "GetObject": true, "StatObject": true, "RemoveObject": true,
	"FPutObject": true, "FGetObject": true, "PresignedGetObject": true, "PresignedPutObject": true,
	"MakeBucket": true, "BucketExists": true, "RemoveBucket": true, "ListObjects": true,
}

func (s *SinkInspector) InspectMinioBucket(call *ssa.CallCommon, svc *iag.Service) {
	callee := call.StaticCallee()
	if callee == nil || callee.Pkg == nil || callee.Pkg.Pkg == nil || !strings.Contains(callee.Pkg.Pkg.Path(), "minio/minio-go") {
		return
	}
	if !minioBucketMethods[callee.Name()] || len(call.Args) < 3 {
		return
	}
	if bucket := ResolveConstantString(call.Args[2]); bucket != "" {
		svc.Buckets = appendUnique(svc.Buckets, bucket)
	}
}

func attachInferredResources(lock *iag.LockFile) {
	for _, svc := range lock.Services {
		for _, b := range svc.Bindings {
			res, ok := lock.Resources[b.ResourceRef]
			if !ok {
				continue
			}
			switch b.Protocol {
			case "kafka":
				res.Topics = unionSorted(res.Topics, svc.Topics)
			case "s3":
				res.Buckets = unionSorted(res.Buckets, svc.Buckets)
			default:
				continue
			}
			lock.Resources[b.ResourceRef] = res
		}
	}
}

func unionSorted(existing, added []string) []string {
	seen := make(map[string]bool, len(existing)+len(added))
	var out []string
	for _, v := range append(append([]string{}, existing...), added...) {
		if !seen[v] {
			seen[v] = true
			out = append(out, v)
		}
	}
	sort.Strings(out)
	return out
}
