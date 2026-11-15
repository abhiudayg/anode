package deployer

import (
	"encoding/json"
	"errors"
	"fmt"
	"io/fs"
	"os"
	"path/filepath"
	"sort"

	"github.com/abhiudayg/anode/internal/iag"
	"github.com/abhiudayg/anode/internal/projectconfig"
)

const StateFileName = "anode.state.json"

type State struct {
	HostPorts map[string]int `json:"host_ports"`
}

func LoadState(rootDir string) (State, error) {
	data, err := os.ReadFile(filepath.Join(rootDir, StateFileName))
	if errors.Is(err, fs.ErrNotExist) {
		return State{HostPorts: map[string]int{}}, nil
	}
	if err != nil {
		return State{}, err
	}
	var s State
	if err := json.Unmarshal(data, &s); err != nil {
		return State{}, fmt.Errorf("invalid %s: %w", StateFileName, err)
	}
	if s.HostPorts == nil {
		s.HostPorts = map[string]int{}
	}
	return s, nil
}

func SaveState(rootDir string, s State) error {
	data, err := json.MarshalIndent(s, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(filepath.Join(rootDir, StateFileName), append(data, '\n'), 0o644)
}

func containerHostPorts(lockfile *iag.LockFile, cfg *projectconfig.File, state *State) map[string]int {
	ports := make(map[string]int)
	var unset []string
	for id, res := range lockfile.Resources {
		if !res.AutoProvision || cfg.Stores[id].Runtime != projectconfig.RuntimeDocker {
			continue
		}
		if port := state.HostPorts[id]; port > 0 {
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
		state.HostPorts[id] = next
		next++
	}
	return ports
}
