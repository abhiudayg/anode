package iag

type SchemaVersion string

const V1 SchemaVersion = "1.0"

// LockFile represents the human-readable, commit-backed contract written to anode.lock.json.
type LockFile struct {
	SchemaVersion SchemaVersion            `json:"schema_version"`
	CommitSHA     string                   `json:"commit_sha,omitempty"`
	Resources     map[string]Resource      `json:"resources"`
	Services      map[string]Service       `json:"services"`
	EgressRules   []EgressRule             `json:"egress_rules,omitempty"`
	Diagnostics   []Diagnostic             `json:"diagnostics,omitempty"`
}

type ResourceKind string

const (
	KindPostgres ResourceKind = "postgres"
	KindRedis    ResourceKind = "redis"
	KindMySQL    ResourceKind = "mysql"
)

type ResourceLifecycle string

const (
	LifecycleStatefulRetain ResourceLifecycle = "stateful_retain"
	LifecycleEphemeral      ResourceLifecycle = "ephemeral"
	LifecycleOrphaned       ResourceLifecycle = "orphaned"
)

// Resource represents a stateful component.
type Resource struct {
	Kind          ResourceKind      `json:"kind"`
	EngineVersion string            `json:"engine_version,omitempty"`
	Lifecycle     ResourceLifecycle `json:"lifecycle"`
	AutoProvision bool              `json:"auto_provision"` // True ONLY if proven via migration assets/contracts
	Provenance    string            `json:"provenance"`
	Migrations    *MigrationSpec    `json:"migrations,omitempty"`
}

// MigrationSpec details schema migrations attached to a resource.
type MigrationSpec struct {
	Tool      string `json:"tool"`      // "goose", "sql", "custom"
	Path      string `json:"path"`      // relative folder path
	Command   string `json:"command,omitempty"`
	Execution string `json:"execution"` // "pre_traffic_job"
}

// Service represents an executable binary component.
type Service struct {
	Name       string      `json:"name"`
	Entrypoint string      `json:"entrypoint"` // e.g. "./services/orders"
	Ingress    []Ingress   `json:"ingress"`
	Bindings   []Binding   `json:"bindings"`
	Secrets    []SecretRef `json:"secrets"`
}

// Ingress defines inbound protocols, routes, and required port env.
type Ingress struct {
	Protocol string   `json:"protocol"`             // "http" | "grpc"
	PortEnv  string   `json:"port_env"`             // e.g. "PORT"
	Routes   []string `json:"routes,omitempty"`     // e.g. ["POST /v1/orders"]
	Service  string   `json:"service,omitempty"`    // e.g. "payment.v1.PaymentService"
}

// Binding links a service to a required resource or another service.
type Binding struct {
	ResourceRef string   `json:"resource_ref,omitempty"`
	ServiceRef  string   `json:"service_ref,omitempty"`
	Protocol    string   `json:"protocol"`               // "postgres" | "redis" | "grpc" | "http"
	Interface   string   `json:"interface,omitempty"`    // e.g. "payment.v1.PaymentService"
	InjectEnv   string   `json:"inject_env"`             // e.g. "DATABASE_URL"
	ExpandedEnv []string `json:"expanded_env,omitempty"` // e.g. ["DB_HOST", "DB_PORT"]
	Provenance  string   `json:"provenance"`
}

// SecretRef identifies sensitive configuration read by the application.
type SecretRef struct {
	EnvVar     string `json:"env_var"`
	Provenance string `json:"provenance"`
}

// EgressRule allows zero-trust firewalls to permit external or internal traffic.
type EgressRule struct {
	SourceService string `json:"source_service"`
	TargetHost    string `json:"target_host"` // e.g. "api.stripe.com" or service name
	Port          int    `json:"port"`        // 443, 80, etc.
	Protocol      string `json:"protocol"`    // "tcp", "https"
	IsExternal    bool   `json:"is_external"`
}

// Diagnostic reports actionable warnings or errors with exact file and line references.
type Diagnostic struct {
	Level      string `json:"level"`      // "error" | "warn" | "info"
	Message    string `json:"message"`
	Provenance string `json:"provenance"` // file:line
	Suggestion string `json:"suggestion,omitempty"`
}

// Graph alias for backwards compatibility
type Graph = LockFile
