package deployer

import (
	"bytes"
	"fmt"
	"net"
	"strings"
	"text/template"

	"github.com/abhiudayg/anode/internal/iag"
)

type SystemdUnitConfig struct {
	ServiceName string
	Description string
	ExecStart   string
	WorkingDir  string
	EnvVars     map[string]string
	RestartSec  int
}

const systemdTemplate = `[Unit]
Description={{.Description}}
After=network.target

[Service]
Type=simple
User=anode
WorkingDirectory={{.WorkingDir}}
ExecStart={{.ExecStart}}
Restart=always
RestartSec={{.RestartSec}}
{{range $k, $v := .EnvVars}}
Environment="{{$k}}={{$v}}"
{{end}}
# Cgroups v2 limits
CPUQuota=200%
MemoryMax=1G

[Install]
WantedBy=multi-user.target
`

// GenerateSystemdUnit creates an atomic systemd service unit string
func GenerateSystemdUnit(cfg SystemdUnitConfig) (string, error) {
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
	return strings.TrimSpace(raw)
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
				sb.WriteString(fmt.Sprintf("  handle %s* {\n", path))
				sb.WriteString(fmt.Sprintf("    reverse_proxy 127.0.0.1:%d\n", port))
				sb.WriteString("  }\n")
			}
		}
	}

	sb.WriteString("}\n")
	return sb.String()
}
