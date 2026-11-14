package logs

import (
	"strings"
	"testing"
)

func TestShellQuoteNeutralisesMetacharacters(t *testing.T) {
	got := shellQuote("1h; rm -rf / $(id)")
	if got != "'1h; rm -rf / $(id)'" {
		t.Errorf("shellQuote = %s", got)
	}
	if shellQuote("a'b") != "'a'\\''b'" {
		t.Errorf("single quotes must be escaped, got %s", shellQuote("a'b"))
	}
}

func TestServiceNamePatternRejectsDot(t *testing.T) {
	if serviceNamePattern.MatchString(".") || !serviceNamePattern.MatchString("cfg-app") {
		t.Errorf("service name validation is wrong")
	}
}

func TestJournalctlCommandQuotesTimeFilters(t *testing.T) {
	cmd := buildJournalctlCommand([]string{"anode-cfg-app.service"}, Options{Since: "1h; id", Lines: 5})
	if !strings.Contains(cmd, "--since='1h; id'") {
		t.Errorf("since filter not quoted: %s", cmd)
	}
}
