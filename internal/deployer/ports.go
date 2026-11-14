package deployer

import (
	"bufio"
	"fmt"
	"sort"
	"strconv"
	"strings"
)

const firstServicePort = 21040
const portRegistryPath = "/etc/anode/ports"

func parsePortRegistry(text string) map[string]int {
	registry := make(map[string]int)
	scanner := bufio.NewScanner(strings.NewReader(text))
	for scanner.Scan() {
		fields := strings.Fields(scanner.Text())
		if len(fields) != 2 {
			continue
		}
		port, err := strconv.Atoi(fields[1])
		if err != nil || port <= 0 || port > 65535 {
			continue
		}
		registry[fields[0]] = port
	}
	return registry
}

func listeningPorts(ssOutput string) map[int]bool {
	ports := make(map[int]bool)
	for _, line := range strings.Split(ssOutput, "\n") {
		fields := strings.Fields(line)
		if len(fields) < 4 {
			continue
		}
		address := fields[3]
		idx := strings.LastIndex(address, ":")
		if idx < 0 {
			continue
		}
		if port, err := strconv.Atoi(address[idx+1:]); err == nil {
			ports[port] = true
		}
	}
	return ports
}

func allocateServicePorts(services []string, registry map[string]int, foreignBusy map[int]bool) (map[string]int, error) {
	sorted := append([]string(nil), services...)
	sort.Strings(sorted)

	assigned := make(map[string]int)
	taken := make(map[int]bool)
	for port := range foreignBusy {
		taken[port] = true
	}

	for _, name := range sorted {
		if port, ok := registry[name]; ok && !taken[port] {
			assigned[name] = port
			taken[port] = true
		}
	}
	next := firstServicePort
	for _, name := range sorted {
		if _, ok := assigned[name]; ok {
			continue
		}
		for taken[next] {
			next++
		}
		if next > 65535 {
			return nil, fmt.Errorf("no free port available for service %s", name)
		}
		assigned[name] = next
		taken[next] = true
	}
	return assigned, nil
}

func formatPortRegistry(assigned map[string]int) string {
	names := make([]string, 0, len(assigned))
	for name := range assigned {
		names = append(names, name)
	}
	sort.Strings(names)
	var sb strings.Builder
	for _, name := range names {
		sb.WriteString(fmt.Sprintf("%s %d\n", name, assigned[name]))
	}
	return sb.String()
}

func (d *DeployCoordinator) allocateHostPorts() (map[string]int, error) {
	out, err := d.ssh.Run("cat " + portRegistryPath + " 2>/dev/null; echo '---'; ss -ltnH")
	if err != nil {
		return nil, fmt.Errorf("failed to read host port state: %w", err)
	}
	parts := strings.SplitN(out, "---", 2)
	if len(parts) != 2 {
		return nil, fmt.Errorf("unexpected host port state output")
	}
	registry := parsePortRegistry(parts[0])
	owned := make(map[int]bool)
	for _, port := range registry {
		owned[port] = true
	}
	foreign := make(map[int]bool)
	for port := range listeningPorts(parts[1]) {
		if !owned[port] {
			foreign[port] = true
		}
	}
	names := make([]string, 0, len(d.lockfile.Services))
	for name := range d.lockfile.Services {
		names = append(names, name)
	}
	assigned, err := allocateServicePorts(names, registry, foreign)
	if err != nil {
		return nil, err
	}
	if err := NewBootstrapper(d.ssh).WriteRemoteFile(formatPortRegistry(assigned), portRegistryPath); err != nil {
		return nil, fmt.Errorf("failed to write port registry: %w", err)
	}
	return assigned, nil
}
