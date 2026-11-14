package catalog

import (
	"encoding/json"
	"fmt"
	"path/filepath"
	"sort"
	"strings"
)

// FormatCatalogTable renders an aligned overview table of all registered stateful drivers.
func FormatCatalogTable(r *Registry, rootDir string) string {
	kinds := r.ListKinds()

	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("📦 Anode Stateful Driver Catalog (%d drivers registered)\n\n", len(kinds)))
	sb.WriteString(fmt.Sprintf("%-16s | %-14s | %-12s | %-6s | %-32s | %s\n",
		"KIND", "CATEGORY", "PROTOCOL", "PORT", "IMAGE TEMPLATE", "SOURCE"))
	sb.WriteString(strings.Repeat("─", 100) + "\n")

	for _, k := range kinds {
		d := r.Resolve(k)
		src := r.Source(k)
		sourceLabel := "[embedded]"
		if src != "embedded" && src != "dynamic_fallback" {
			if rootDir != "" {
				if rel, err := filepath.Rel(rootDir, src); err == nil && !strings.HasPrefix(rel, "..") {
					sourceLabel = fmt.Sprintf("[%s]", rel)
				} else {
					sourceLabel = fmt.Sprintf("[%s]", filepath.Base(src))
				}
			} else {
				sourceLabel = fmt.Sprintf("[%s]", filepath.Base(src))
			}
		}

		category := d.Category
		if category == "" {
			category = "database"
		}

		sb.WriteString(fmt.Sprintf("%-16s | %-14s | %-12s | %-6d | %-32s | %s\n",
			d.Kind,
			category,
			d.Networking.Protocol,
			d.Networking.PrimaryPort,
			d.Runtime.ImageTemplate,
			sourceLabel,
		))
	}

	return sb.String()
}

// FormatDriverDetail renders a comprehensive terminal inspection card for a single driver.
func FormatDriverDetail(d *DriverSpec, source string) string {
	var sb strings.Builder

	sourceLabel := "[embedded default]"
	if source != "embedded" && source != "dynamic_fallback" {
		sourceLabel = fmt.Sprintf("[custom: %s]", source)
	}

	sb.WriteString(fmt.Sprintf("⚡ Anode Driver Specification: %s\n", d.Kind))
	if d.Category != "" {
		sb.WriteString(fmt.Sprintf("Category:        %s\n", d.Category))
	}
	sb.WriteString(fmt.Sprintf("Source:          %s\n", sourceLabel))
	if d.DefaultVersion != "" {
		sb.WriteString(fmt.Sprintf("Default Version: %s\n", d.DefaultVersion))
	}
	sb.WriteString(strings.Repeat("─", 80) + "\n\n")

	// 1. Runtime & Container
	sb.WriteString("[RUNTIME & CONTAINER]\n")
	sb.WriteString(fmt.Sprintf("  Image Template:   %s\n", d.Runtime.ImageTemplate))
	if d.Runtime.DataMount != "" {
		sb.WriteString(fmt.Sprintf("  Data Mount:       %s\n", d.Runtime.DataMount))
	}
	if len(d.Runtime.Command) > 0 {
		sb.WriteString(fmt.Sprintf("  Command:          %s\n", strings.Join(d.Runtime.Command, " ")))
	}
	if len(d.Runtime.DefaultEnv) > 0 {
		sb.WriteString("  Default Env:      ")
		var envs []string
		for k, v := range d.Runtime.DefaultEnv {
			envs = append(envs, fmt.Sprintf("%s=%s", k, v))
		}
		sort.Strings(envs)
		sb.WriteString(strings.Join(envs, ", ") + "\n")
	}
	sb.WriteString("\n")

	// 2. Networking & Ports
	sb.WriteString("[NETWORKING & PORTS]\n")
	sb.WriteString(fmt.Sprintf("  Protocol:         %s\n", d.Networking.Protocol))
	sb.WriteString(fmt.Sprintf("  Primary Port:     %d\n", d.Networking.PrimaryPort))
	if d.Networking.BindInterface != "" {
		sb.WriteString(fmt.Sprintf("  Bind Interface:   %s\n", d.Networking.BindInterface))
	}
	sb.WriteString("\n")

	// 3. Environment Variable Templates (Injected into Go apps)
	if len(d.ConnectionEnv) > 0 {
		sb.WriteString("[INJECTED CONNECTION VARIABLES]\n")
		var keys []string
		for k := range d.ConnectionEnv {
			keys = append(keys, k)
		}
		sort.Strings(keys)
		for _, k := range keys {
			sb.WriteString(fmt.Sprintf("  %-16s  %s\n", k+":", d.ConnectionEnv[k]))
		}
		sb.WriteString("\n")
	}

	// 4. Readiness Probe
	if len(d.ReadinessProbe.Command) > 0 || d.ReadinessProbe.TCPPort > 0 || d.ReadinessProbe.HTTPPath != "" {
		sb.WriteString("[READINESS PROBE]\n")
		if len(d.ReadinessProbe.Command) > 0 {
			sb.WriteString(fmt.Sprintf("  Command:          %s\n", strings.Join(d.ReadinessProbe.Command, " ")))
		}
		if d.ReadinessProbe.TCPPort > 0 {
			sb.WriteString(fmt.Sprintf("  TCP Port:         %d\n", d.ReadinessProbe.TCPPort))
		}
		if d.ReadinessProbe.HTTPPath != "" {
			sb.WriteString(fmt.Sprintf("  HTTP Path:        %s\n", d.ReadinessProbe.HTTPPath))
		}
		if d.ReadinessProbe.InitialDelaySec > 0 {
			sb.WriteString(fmt.Sprintf("  Initial Delay:    %ds\n", d.ReadinessProbe.InitialDelaySec))
		}
		if d.ReadinessProbe.TimeoutSec > 0 {
			sb.WriteString(fmt.Sprintf("  Timeout:          %ds\n", d.ReadinessProbe.TimeoutSec))
		}
		sb.WriteString("\n")
	}

	// 5. Security & Cgroups
	sb.WriteString("[SECURITY & CGROUPS V2]\n")
	sb.WriteString(fmt.Sprintf("  POSIX UID / GID:  %d / %d\n", d.Security.UID, d.Security.GID))
	if d.Security.FileMode != "" {
		sb.WriteString(fmt.Sprintf("  File Mode:        %s\n", d.Security.FileMode))
	}
	sb.WriteString(fmt.Sprintf("  NoNewPrivileges:  %t\n", d.Security.NoNewPrivileges))
	if d.Security.OOMScoreAdjust != 0 {
		sb.WriteString(fmt.Sprintf("  OOMScoreAdjust:   %d\n", d.Security.OOMScoreAdjust))
	}
	if d.Security.Cgroups.MemoryMax != "" {
		sb.WriteString(fmt.Sprintf("  Memory Ceiling:   %s\n", d.Security.Cgroups.MemoryMax))
	}
	if d.Security.Cgroups.CPUQuota != "" {
		sb.WriteString(fmt.Sprintf("  CPU Quota:        %s\n", d.Security.Cgroups.CPUQuota))
	}

	return sb.String()
}

// FormatJSON serializes any catalog structure to indented JSON.
func FormatJSON(v interface{}) (string, error) {
	bytes, err := json.MarshalIndent(v, "", "  ")
	if err != nil {
		return "", err
	}
	return string(bytes), nil
}
