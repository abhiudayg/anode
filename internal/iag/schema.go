package iag

type Graph struct {
	SchemaVersion string              `json:"schema_version"`
	Resources     map[string]Resource `json:"resources"`
	Services      []Service           `json:"services"`
	Diagnostics   []Diagnostic        `json:"diagnostics,omitempty"`
}

type Resource struct {
	Kind       string `json:"kind"`                 // "postgres" | "redis"
	Lifecycle  string `json:"lifecycle"`            // "stateful_retain" | "ephemeral"
	Provenance string `json:"provenance"`           // e.g. "internal/db/conn.go:24"
}

type Service struct {
	Name       string      `json:"name"`
	Entrypoint string      `json:"entrypoint"`       // e.g. "./cmd/orders"
	Ingress    []Ingress   `json:"ingress"`
	Bindings   []Binding   `json:"bindings"`
	Secrets    []SecretRef `json:"secrets"`
}

type Ingress struct {
	Protocol string   `json:"protocol"`             // "http" | "grpc"
	PortEnv  string   `json:"port_env"`             // e.g. "PORT"
	Routes   []string `json:"routes,omitempty"`     // e.g. ["POST /v1/orders"]
	Service  string   `json:"service,omitempty"`    // e.g. "payment.v1.PaymentService"
}

type Binding struct {
	ResourceRef string `json:"resource_ref,omitempty"`
	ServiceRef  string `json:"service_ref,omitempty"`
	Protocol    string `json:"protocol"`             // "postgres" | "redis" | "grpc" | "http"
	InjectEnv   string `json:"inject_env"`           // e.g. "DATABASE_URL"
	Provenance  string `json:"provenance"`           // file:line
}

type SecretRef struct {
	EnvVar     string `json:"env_var"`
	Provenance string `json:"provenance"`
}

type Diagnostic struct {
	Level      string `json:"level"`                // "error" | "warn"
	Message    string `json:"message"`
	Provenance string `json:"provenance"`
}
