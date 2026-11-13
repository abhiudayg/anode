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
