package catalog

import "testing"

func TestNoDriverDefaultsToLatest(t *testing.T) {
	reg := NewRegistry()
	for kind, driver := range reg.All() {
		if driver.DefaultVersion == "latest" {
			t.Errorf("%s defaults to latest; pin a version or leave it empty", kind)
		}
	}
	if reg.Resolve("unknown-store-kind").DefaultVersion != "" {
		t.Errorf("the dynamic fallback must not choose a version")
	}
}
