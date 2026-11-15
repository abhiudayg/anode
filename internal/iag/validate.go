package iag

import (
	"fmt"
	"path/filepath"
	"regexp"
	"strings"
)

var validIdentifierRegex = regexp.MustCompile(`^[a-zA-Z0-9_\-\.]+$`)

// IsValidIdentifier checks whether a service, resource, or network identifier is safe from shell metacharacters.
func IsValidIdentifier(id string) bool {
	if len(id) == 0 || len(id) > 128 {
		return false
	}
	return validIdentifierRegex.MatchString(id)
}

// ValidateIdentifier returns an error if the identifier contains invalid or dangerous characters.
func ValidateIdentifier(kind string, id string) error {
	if !IsValidIdentifier(id) {
		return fmt.Errorf("invalid %s identifier %q: must match [a-zA-Z0-9_.-]+ with length 1..128", kind, id)
	}
	return nil
}

// SafeResolvePath verifies that a relative path stays hermetically bounded inside rootDir.
func SafeResolvePath(rootDir string, relPath string) (string, error) {
	absRoot, err := filepath.Abs(rootDir)
	if err != nil {
		return "", fmt.Errorf("failed to resolve root directory: %w", err)
	}

	cleanRel := filepath.Clean(relPath)
	if strings.HasPrefix(cleanRel, "..") || filepath.IsAbs(cleanRel) {
		return "", fmt.Errorf("path %q attempts directory traversal outside root", relPath)
	}

	target := filepath.Join(absRoot, cleanRel)
	rel, err := filepath.Rel(absRoot, target)
	if err != nil || strings.HasPrefix(rel, "..") {
		return "", fmt.Errorf("target path %q escapes root %q", target, absRoot)
	}

	return target, nil
}

var (
	kafkaTopicPattern   = regexp.MustCompile(`^[A-Za-z0-9._-]{1,249}$`)
	bucketNamePattern   = regexp.MustCompile(`^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$`)
	collectionPattern   = regexp.MustCompile(`^[A-Za-z0-9_-]{1,255}$`)
	envNamePattern      = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]{0,127}$`)
	domainNamePattern   = regexp.MustCompile(`^(?i)[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?(\.[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?)*$`)
	linuxAccountPattern = regexp.MustCompile(`^[a-z_][a-z0-9_-]{0,31}$`)
	keyspacePattern     = regexp.MustCompile(`^[A-Za-z_][A-Za-z0-9_]{0,47}$`)
)

func ValidateKafkaTopic(name string) error {
	return checkName("kafka topic", name, kafkaTopicPattern)
}

func ValidateBucket(name string) error {
	return checkName("bucket", name, bucketNamePattern)
}

func ValidateCollection(name string) error {
	return checkName("vector collection", name, collectionPattern)
}

func ValidateEnvName(name string) error {
	return checkName("environment variable", name, envNamePattern)
}

func ValidateDomain(name string) error {
	return checkName("domain", name, domainNamePattern)
}

func ValidateLinuxAccount(name string) error {
	return checkName("account", name, linuxAccountPattern)
}

func ValidateKeyspace(name string) error {
	return checkName("keyspace", name, keyspacePattern)
}

func checkName(kind, value string, pattern *regexp.Regexp) error {
	if !pattern.MatchString(value) {
		return fmt.Errorf("invalid %s %q", kind, value)
	}
	return nil
}
