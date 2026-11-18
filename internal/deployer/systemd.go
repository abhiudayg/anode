package deployer

import (
	"bytes"
	"fmt"
	"net"
	"regexp"
	"sort"
	"strings"
	"text/template"

	"github.com/abhiudayg/anode/internal/iag"
)

type SystemdUnitConfig struct {
	ServiceName string
	Description string
	ExecStart   string
	StateDir    string
	EnvVars     map[string]string
	EnvFile     string
	PreStart    []string
	RestartSec  int
}

var stateDirPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)

func envName(serviceName string) string {
	return strings.ToUpper(strings.ReplaceAll(serviceName, "-", "_"))
}

const systemdTemplate = `[Unit]
Description={{.Description}}
After=network.target
# A crash loop stops after 5 failed starts in 60 s instead of retrying forever.
StartLimitIntervalSec=60
StartLimitBurst=5

[Service]
Type=simple
DynamicUser=yes
StateDirectory={{.StateDir}}
WorkingDirectory=/var/lib/{{.StateDir}}
{{range .PreStart}}ExecStartPre=+{{.}}
{{end}}ExecStart={{.ExecStart}}
Restart=always
RestartSec={{.RestartSec}}
# Stop: SIGTERM, then up to 10 s for the service to drain in-flight requests
KillSignal=SIGTERM
TimeoutStopSec=10
{{if .EnvFile}}EnvironmentFile={{.EnvFile}}
{{end}}{{range $k, $v := .EnvVars}}Environment="{{$k}}={{$v}}"
{{end}}
# Cgroups v2 Resource Limits
CPUQuota=200%
MemoryMax=1G

# Least-Privilege Security Hardening & Anti-Jailbreak Confinement
NoNewPrivileges=true
ProtectSystem=strict
ProtectHome=true
PrivateTmp=true
PrivateDevices=true
ProtectKernelTunables=true
ProtectControlGroups=true
ProtectKernelModules=true
ProtectKernelLogs=true
ProtectClock=true
RestrictSUIDSGID=true
RestrictRealtime=true
RestrictNamespaces=true
LockPersonality=true
MemoryDenyWriteExecute=true
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6
CapabilityBoundingSet=
AmbientCapabilities=
UMask=0077
ProtectProc=invisible
ProcSubset=pid
SystemCallArchitectures=native
SystemCallFilter=@system-service
SystemCallFilter=~@privileged @resources @obsolete @module @reboot @swap @raw-io

[Install]
WantedBy=multi-user.target
`

// GenerateSystemdUnit creates an atomic systemd service unit string
func GenerateSystemdUnit(cfg SystemdUnitConfig) (string, error) {
	if err := validateUnitConfig(cfg); err != nil {
		return "", err
	}
	if !stateDirPattern.MatchString(cfg.StateDir) {
		return "", fmt.Errorf("invalid state directory name %q: use lowercase letters, digits, and hyphens", cfg.StateDir)
	}
	if cfg.RestartSec == 0 {
		cfg.RestartSec = 3
	}
	tmpl, err := template.New("systemd").Parse(systemdTemplate)
	if err != nil {
		return "", err
	}
	var buf bytes.Buffer
	if err := tmpl.Execute(&buf, cfg); err != nil {
		return "", err
	}
	return buf.String(), nil
}

func cleanDomain(raw string) string {
	if idx := strings.Index(raw, "@"); idx != -1 {
		raw = raw[idx+1:]
	}
	if idx := strings.Index(raw, ":"); idx != -1 {
		raw = raw[:idx]
	}
	raw = strings.TrimSpace(raw)
	// Sanitize against Caddy directive breakout injection
	raw = strings.Map(func(r rune) rune {
		if r == '\n' || r == '\r' || r == '{' || r == '}' || r == '"' || r == ';' {
			return -1
		}
		return r
	}, raw)
	return raw
}

// GenerateCaddyfile creates reverse-proxy config with automatic Let's Encrypt TLS
func GenerateCaddyfile(domain string, lockfile *iag.LockFile, servicePortMap map[string]int) string {
	clean := cleanDomain(domain)
	siteAddress := clean
	if net.ParseIP(clean) != nil || clean == "localhost" || clean == "127.0.0.1" {
		siteAddress = fmt.Sprintf("http://%s:80", clean)
	}

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s {\n", siteAddress))
	sb.WriteString("  encode gzip zstd\n")

	names := make([]string, 0, len(lockfile.Services))
	for name := range lockfile.Services {
		names = append(names, name)
	}
	sort.Strings(names)
	claimed := make(map[string]bool)
	for _, name := range names {
		svc := lockfile.Services[name]
		port := servicePortMap[name]
		if port == 0 {
			port = 8080
		}
		seen := make(map[string]bool)
		for _, ing := range svc.Ingress {
			for _, r := range ing.Routes {
				path := caddyRoutePath(r)
				if path == "" || seen[path] {
					continue
				}
				seen[path] = true
				if !claimed[path] {
					claimed[path] = true
					writeCaddyRoute(&sb, path, "", port)
					continue
				}
				prefix := "/" + name
				writeCaddyRoute(&sb, prefix+path, prefix, port)
			}
		}
	}

	sb.WriteString("}\n")
	return sb.String()
}

// caddyRoutePath returns the static path of a route such as "POST /v1/orders", or "" if the route has none.
func caddyRoutePath(route string) string {
	path := route
	if parts := strings.Split(route, " "); len(parts) == 2 {
		path = parts[1]
	}
	path = strings.TrimSpace(path)
	if strings.ContainsAny(path, "\r\n") {
		return ""
	}
	if i := strings.Index(path, "{"); i >= 0 {
		path = path[:i]
	}
	if path == "" || path == "/" {
		return ""
	}
	return path
}

// writeCaddyRoute writes one handle block. A non-empty strip removes the service prefix before proxying.
func writeCaddyRoute(sb *strings.Builder, public, strip string, port int) {
	sb.WriteString(fmt.Sprintf("  handle %s* {\n", public))
	if strip != "" {
		sb.WriteString(fmt.Sprintf("    uri strip_prefix %s\n", strip))
	}
	// Hold requests while the upstream restarts (RestartSec plus boot), instead of failing them.
	// The hold must outlast a restart: drain (up to 8 s, see examples/marketplace/services/orders) plus RestartSec (3 s) plus boot.
	sb.WriteString(fmt.Sprintf("    reverse_proxy 127.0.0.1:%d {\n      lb_try_duration 15s\n      lb_try_interval 100ms\n    }\n", port))
	sb.WriteString("  }\n")
}
