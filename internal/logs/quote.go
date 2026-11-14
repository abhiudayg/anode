package logs

import (
	"regexp"
	"strings"
)

var serviceNamePattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{0,62}$`)

func shellQuote(value string) string {
	return "'" + strings.ReplaceAll(value, "'", `'\''`) + "'"
}
