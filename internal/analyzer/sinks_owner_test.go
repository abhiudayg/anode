package analyzer

import (
	"go/token"
	"path/filepath"
	"testing"
)

func TestSinkOwnershipCountsOnlyProjectFiles(t *testing.T) {
	root := filepath.Join(t.TempDir(), "project")
	fset := token.NewFileSet()
	inspector := NewSinkInspector(root, fset)

	cases := map[string]bool{
		filepath.Join(root, "main.go"):                                                  true,
		filepath.Join(root, "internal", "store", "db.go"):                               true,
		filepath.Join(root+"-other", "db.go"):                                           false,
		filepath.Join(filepath.Dir(root), "gopath", "pkg", "mod", "atlas", "driver.go"): false,
	}
	for file, want := range cases {
		f := fset.AddFile(file, -1, 100)
		if got := inspector.ownsPos(f.Pos(1)); got != want {
			t.Errorf("ownsPos(%s) = %v, want %v", file, got, want)
		}
	}
}

func TestSinkOwnershipRejectsInvalidPosition(t *testing.T) {
	inspector := NewSinkInspector(t.TempDir(), token.NewFileSet())
	if inspector.ownsPos(token.NoPos) {
		t.Errorf("NoPos must not count as project code")
	}
}
