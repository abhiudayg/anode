package iag

// SchemaVersion defines the schema version of the Intermediate Application Graph.
type SchemaVersion string

const V1 SchemaVersion = "1.0"

// Graph represents the full Intermediate Application Graph (IAG) extracted from source code.
type Graph struct {
	SchemaVersion SchemaVersion            `json:"schema_version"`
	CommitSHA     string                   `json:"commit_sha,omitempty"`
	Resources     map[string]Resource      `json:"resources"`
	Services      map[string]Service       `json:"services"`
	Policies      []NetworkPolicy          `json:"policies,omitempty"`
}

// ResourceKind represents an infrastructure primitive required by the application.
type ResourceKind string

const (
	KindPostgres ResourceKind = "postgres"
	KindRedis    ResourceKind = "redis"
	KindS3Bucket ResourceKind = "s3_bucket"
)

// ResourceLifecycle controls teardown and data retention behaviors.
type ResourceLifecycle string

const (
	LifecycleStatefulRetain ResourceLifecycle = "stateful_retain"
	LifecycleEphemeral      ResourceLifecycle = "ephemeral"
)

// Resource defines an infrastructure component provisioned or managed for the app.
type Resource struct {
	Kind          ResourceKind      `json:"kind"`
	EngineVersion string            `json:"engine_version,omitempty"`
	Lifecycle     ResourceLifecycle `json:"lifecycle"`
	Migrations    *MigrationSpec    `json:"migrations,omitempty"`
}

// MigrationSpec defines schema migration details detected for a stateful resource.
type MigrationSpec struct {
	Tool      string `json:"tool"`      // "goose", "golang-migrate", "sql"
	Path      string `json:"path"`      // Relative directory containing migrations
	Execution string `json:"execution"` // e.g. "pre_traffic_job"
}

// Service represents an executable microservice or application component.
type Service struct {
	Name       string        `json:"name"`
	PackageDir string        `json:"package_dir"`
	Ingress    []IngressSpec `json:"ingress"`
	Bindings   []BindingSpec `json:"bindings"`
	Secrets    []string      `json:"secrets"`
}

// IngressSpec defines inbound communication endpoints.
type IngressSpec struct {
	Protocol string   `json:"protocol"` // "http", "grpc"
	PortEnv  string   `json:"port_env"` // e.g. "PORT"
	Routes   []string `json:"routes,omitempty"`
}

// BindingSpec links a service to a required resource or another service.
type BindingSpec struct {
	TargetKind string `json:"target_kind"`          // "resource" or "service"
	TargetRef  string `json:"target_ref"`           // Resource ID or Target Service Name
	Protocol   string `json:"protocol"`             // "tcp", "grpc", "http"
	Interface  string `json:"interface,omitempty"`  // e.g. "payment.v1.PaymentService"
	InjectEnv  string `json:"inject_env"`           // e.g. "DATABASE_URL", "PAYMENT_ADDR"
}

// NetworkPolicy represents an explicit zero-trust communication rule.
type NetworkPolicy struct {
	SourceService string `json:"source_service"`
	Target        string `json:"target"`
	AllowTraffic  bool   `json:"allow_traffic"`
}
