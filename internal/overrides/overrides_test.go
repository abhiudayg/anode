package overrides

import (
	"encoding/json"
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/iag"
)

func lockWithTopics(topics ...string) *iag.LockFile {
	return &iag.LockFile{
		Resources: map[string]iag.Resource{"shipping-kafka": {Kind: "kafka", Topics: topics}},
		Services:  map[string]iag.Service{"shipping": {ConfigEnv: []string{"PORT"}}},
	}
}

func raw(t *testing.T, v any) json.RawMessage {
	t.Helper()
	b, err := json.Marshal(v)
	if err != nil {
		t.Fatal(err)
	}
	return b
}

func TestOverrideAppliesWhileInferredValueHolds(t *testing.T) {
	lock := lockWithTopics("shipments.created")
	f := File{Overrides: []Override{{
		Path:     "resources.shipping-kafka.topics",
		Value:    raw(t, []string{"shipments.v2"}),
		Inferred: raw(t, []string{"shipments.created"}),
	}}}
	if err := Apply(lock, f); err != nil {
		t.Fatalf("override against the current inferred value must apply: %v", err)
	}
	if got := lock.Resources["shipping-kafka"].Topics; len(got) != 1 || got[0] != "shipments.v2" {
		t.Fatalf("override not applied, topics = %v", got)
	}
}

func TestOverrideConflictStopsWhenCodeChangesInferredValue(t *testing.T) {
	lock := lockWithTopics("shipments.created", "returns.created")
	f := File{Overrides: []Override{{
		Path:     "resources.shipping-kafka.topics",
		Value:    raw(t, []string{"shipments.v2"}),
		Inferred: raw(t, []string{"shipments.created"}),
	}}}
	err := Apply(lock, f)
	if err == nil || !strings.Contains(err.Error(), "override conflict") {
		t.Fatalf("a changed inferred value must be reported as a conflict, got %v", err)
	}
	if got := lock.Resources["shipping-kafka"].Topics; len(got) != 2 {
		t.Fatalf("a conflicting override must not change the lock, topics = %v", got)
	}
}

func TestOverrideRejectsUnsupportedField(t *testing.T) {
	lock := lockWithTopics("shipments.created")
	f := File{Overrides: []Override{{
		Path:     "resources.shipping-kafka.provenance",
		Value:    raw(t, "x"),
		Inferred: raw(t, "y"),
	}}}
	if err := Apply(lock, f); err == nil {
		t.Fatalf("a field that is not inferred must not be overridable")
	}
}
