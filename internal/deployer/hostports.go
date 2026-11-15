package deployer

import (
	"github.com/abhiudayg/anode/internal/catalog"
)

const containerHostPortBase = 31000

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
