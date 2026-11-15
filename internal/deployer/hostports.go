package deployer

import (
	"sort"

	"github.com/abhiudayg/anode/internal/catalog"
	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

const containerHostPortBase = 31000

func containerHostPorts(lockfile *iag.LockFile, cfg *projectconfig.File) map[string]int {
	ports := make(map[string]int)
	var unset []string
	for id, res := range lockfile.Resources {
		if !res.AutoProvision || cfg.Stores[id].Runtime != projectconfig.RuntimeDocker {
			continue
		}
		if port := cfg.Stores[id].HostPort; port > 0 {
			ports[id] = port
		} else {
			unset = append(unset, id)
		}
	}
	sort.Strings(unset)
	next := containerHostPortBase
	for _, id := range unset {
		for portInUse(ports, next) {
			next++
		}
		ports[id] = next
		next++
	}
	return ports
}

func portInUse(ports map[string]int, port int) bool {
	for _, used := range ports {
		if used == port {
			return true
		}
	}
	return false
}

func hostPortFor(ports map[string]int, resourceID string, driver *catalog.DriverSpec) int {
	if port, ok := ports[resourceID]; ok {
		return port
	}
	return driver.Networking.PrimaryPort
}
