package deployer

import (
	"sort"

	"github.com/abhiudayg/anode/internal/catalog"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

const containerHostPortBase = 31000

func containerHostPorts(lockfile *iag.LockFile, cfg *projectconfig.File) map[string]int {
	ids := make([]string, 0)
	for id, res := range lockfile.Resources {
		if res.AutoProvision && cfg.Stores[id].Runtime == projectconfig.RuntimeDocker {
			ids = append(ids, id)
		}
	}
	sort.Strings(ids)
	ports := make(map[string]int, len(ids))
	for i, id := range ids {
		ports[id] = containerHostPortBase + i
	}
	return ports
}

func hostPortFor(ports map[string]int, resourceID string, driver *catalog.DriverSpec) int {
	if port, ok := ports[resourceID]; ok {
		return port
	}
	return driver.Networking.PrimaryPort
}
