package ps

import (
	"time"
)

// ServiceState represents the normalized operational health of a managed service.
type ServiceState string

const (
	StateRunning     ServiceState = "running"
	StateRestarting  ServiceState = "auto-restart"
	StateCrashLoop   ServiceState = "crashloop"
	StateFailed      ServiceState = "failed"
	StateInactive    ServiceState = "inactive"
	StateUnknown     ServiceState = "unknown"
)

// MemoryBreakdown details the cgroup memory.stat or proc smaps breakdown into anonymous, file cache, and kernel usage.
type MemoryBreakdown struct {
	AnonBytes   uint64 `json:"anon_bytes"`           // Process memory: heap, goroutine stacks, anonymous mmap
	FileBytes   uint64 `json:"file_bytes"`           // Page cache: cached disk blocks, shared libraries, binary text
	KernelBytes uint64 `json:"kernel_bytes,omitempty"` // Kernel memory: slab, socket buffers, page tables, kernel stacks
	SlabBytes   uint64 `json:"slab_bytes,omitempty"` // In-kernel slab allocator (dentries, inodes)
	SockBytes   uint64 `json:"sock_bytes,omitempty"` // TCP/UDP network socket buffers
	ShmemBytes  uint64 `json:"shmem_bytes,omitempty"`// Shared memory & tmpfs
	AnonHuman   string `json:"anon"`
	FileHuman   string `json:"file"`
	KernelHuman string `json:"kernel,omitempty"`
}

// ServiceStatus contains low-level process and cgroup metrics for a single service.
type ServiceStatus struct {
	Name            string           `json:"name"`
	UnitName        string           `json:"unit_name"`
	State           ServiceState     `json:"state"`
	ActiveState     string           `json:"active_state"`
	SubState        string           `json:"sub_state"`
	PID             int              `json:"pid"`
	TasksCurrent    int              `json:"tasks_current"`
	MemoryBytes     uint64           `json:"memory_bytes"`
	MemoryMaxBytes  uint64           `json:"memory_max_bytes"`
	MemoryHuman     string           `json:"memory_human"`
	MemoryBreakdown *MemoryBreakdown `json:"memory_breakdown,omitempty"`
	CPUUsageNSec    uint64           `json:"cpu_usage_nsec,omitempty"`
	CPUQuota        string           `json:"cpu_quota,omitempty"`
	NRestarts       int              `json:"restarts"`
	ExitCode        int              `json:"exit_code,omitempty"`
	Uptime          time.Duration    `json:"uptime_duration,omitempty"`
	UptimeHuman     string           `json:"uptime"`
	Port            int              `json:"port,omitempty"`
	PublicEndpoints []string         `json:"public_endpoints,omitempty"`
	CgroupFallback  bool             `json:"cgroup_fallback,omitempty"`
}

// EdgeStatus represents the Caddy reverse-proxy health and route configuration.
type EdgeStatus struct {
	Active     bool              `json:"active"`
	Version    string            `json:"version,omitempty"`
	Domain     string            `json:"domain,omitempty"`
	TLSActive  bool              `json:"tls_active"`
	RouteRules map[string]string `json:"route_rules,omitempty"` // e.g. "/api/*" -> "127.0.0.1:21040"
}

// StatefulResourceStatus represents a database or cache dependency.
type StatefulResourceStatus struct {
	Name     string `json:"name"`
	Kind     string `json:"kind"`
	Endpoint string `json:"endpoint"`
	Status   string `json:"status"`
}

// ProcessReport holds the complete topology runtime state.
type ProcessReport struct {
	Target       string                   `json:"target,omitempty"`
	IsRemote     bool                     `json:"is_remote"`
	ReleaseID    string                   `json:"release_id,omitempty"`
	Edge         *EdgeStatus              `json:"edge,omitempty"`
	Services     []ServiceStatus          `json:"services"`
	Resources    []StatefulResourceStatus `json:"resources,omitempty"`
	CgroupsMode  string                   `json:"cgroups_mode"` // "v2 (unified)", "v1 (hybrid/fallback)", "unsupported"
	Timestamp    time.Time                `json:"timestamp"`
	Verbose      bool                     `json:"verbose,omitempty"`
}

// Options configures the ps / status command.
type Options struct {
	Target     string // Remote user@host, or empty for local
	TargetDir  string // Local project workspace directory
	All        bool   // Include stopped/inactive services
	JSON       bool   // Output machine-readable JSON
	Verbose    bool   // Detailed debug output
}
