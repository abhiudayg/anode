package devengine

import (
	"fmt"
	"sort"
	"strings"
)

func (e *Engine) Report(plan map[string]map[string]string) {
	resIDs := make([]string, 0, len(e.allocatedDBPorts))
	for resID := range e.allocatedDBPorts {
		resIDs = append(resIDs, resID)
	}
	sort.Strings(resIDs)
	for _, resID := range resIDs {
		fmt.Printf("  ✓ Postgres %s on 127.0.0.1:%d (container anode-%s)\n", resID, e.allocatedDBPorts[resID], resID)
	}

	migrated := make([]string, 0, len(e.migrationsApplied))
	for resID := range e.migrationsApplied {
		migrated = append(migrated, resID)
	}
	sort.Strings(migrated)
	for _, resID := range migrated {
		fmt.Printf("  ✓ Applied %d migration(s) for %s\n", e.migrationsApplied[resID], resID)
	}
	if len(migrated) == 0 {
		fmt.Println("  • No migrations to apply")
	}

	services := make([]string, 0, len(plan))
	for svc := range plan {
		services = append(services, svc)
	}
	sort.Strings(services)
	for _, svc := range services {
		keys := make([]string, 0, len(plan[svc]))
		for key := range plan[svc] {
			keys = append(keys, key)
		}
		sort.Strings(keys)
		for _, key := range keys {
			value := plan[svc][key]
			if key != "PORT" && strings.Contains(value, "://") {
				value = "<set>"
			}
			fmt.Printf("  • %s: %s = %s\n", svc, key, value)
		}
	}
}
