package deployer

import "testing"

func TestEnvNameIsValidForHyphenatedService(t *testing.T) {
	if got := envName("filebrowser-example"); got != "FILEBROWSER_EXAMPLE" {
		t.Errorf("envName(filebrowser-example) = %q, want FILEBROWSER_EXAMPLE", got)
	}
}
