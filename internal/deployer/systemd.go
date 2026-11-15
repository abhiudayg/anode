package deployer

import (
	"bytes"
	"fmt"
	"net"
	"regexp"
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

[Service]
Type=simple
DynamicUser=yes
StateDirectory={{.StateDir}}
WorkingDirectory=/var/lib/{{.StateDir}}
{{range .PreStart}}ExecStartPre=+{{.}}
{{end}}ExecStart={{.ExecStart}}
Restart=always
RestartSec={{.RestartSec}}
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

	for _, svc := range lockfile.Services {
		port := servicePortMap[svc.Name]
		if port == 0 {
			port = 8080
		}
		for _, ing := range svc.Ingress {
			for _, r := range ing.Routes {
				parts := strings.Split(r, " ")
				path := r
				if len(parts) == 2 {
					path = parts[1]
				}
				cleanPath := strings.TrimSpace(path)
				if strings.ContainsAny(cleanPath, "\r\n") {
					continue
				}
				if i := strings.Index(cleanPath, "{"); i >= 0 {
					cleanPath = cleanPath[:i]
				}
				if cleanPath == "" || cleanPath == "/" {
					continue
				}
				sb.WriteString(fmt.Sprintf("  handle %s* {\n", cleanPath))
				sb.WriteString(fmt.Sprintf("    reverse_proxy 127.0.0.1:%d\n", port))
				sb.WriteString("  }\n")
			}
		}
	}

	sb.WriteString("}\n")
	return sb.String()
}
