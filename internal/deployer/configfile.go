package deployer

import (
	"encoding/json"
	"fmt"
	"strings"
)

const dynamicUserNameLimit = 31

func BuildConfigDocument(values map[string]string) ([]byte, error) {
	doc := map[string]any{}
	for dotted, value := range values {
		if err := setConfigValue(doc, dotted, value); err != nil {
			return nil, err
		}
	}
	return json.MarshalIndent(doc, "", "  ")
}

func setConfigValue(doc map[string]any, dotted string, value string) error {
	parts := strings.Split(dotted, ".")
	node := doc
	for _, part := range parts[:len(parts)-1] {
		child, exists := node[part]
		if !exists {
			next := map[string]any{}
			node[part] = next
			node = next
			continue
		}
		next, ok := child.(map[string]any)
		if !ok {
			return fmt.Errorf("config key %q conflicts with a value at %q", dotted, part)
		}
		node = next
	}
	last := parts[len(parts)-1]
	if _, exists := node[last]; exists {
		return fmt.Errorf("config key %q conflicts with an existing value", dotted)
	}
	node[last] = value
	return nil
}

func dynamicUserName(serviceName string) (string, error) {
	name := "anode-" + serviceName
	if len(name) > dynamicUserNameLimit {
		return "", fmt.Errorf("service name %q is too long for the systemd user %q (limit %d characters)", serviceName, name, dynamicUserNameLimit)
	}
	return name, nil
}

func configHandoffCommand(serviceName, sourcePath, configFile string) (string, error) {
	if !validConfigFileName(configFile) {
		return "", fmt.Errorf("config file name %q must be a plain .json file name", configFile)
	}
	user, err := dynamicUserName(serviceName)
	if err != nil {
		return "", err
	}
	return fmt.Sprintf("/usr/bin/install -m 0400 -o %s -g %s %s /var/lib/%s/%s", user, user, sourcePath, serviceName, configFile), nil
}
