package compiler_test

import (
	"path/filepath"
	"testing"

	"github.com/abhiudayg/anode/pkg/compiler"
)

func TestCompilerSampleShop(t *testing.T) {
	sampleShopDir, err := filepath.Abs("../../examples/sample-shop")
	if err != nil {
		t.Fatalf("failed to resolve examples path: %v", err)
	}

	comp := compiler.New(sampleShopDir)
	graph, err := comp.Compile("./...")
	if err != nil {
		t.Fatalf("Compiler.Compile failed: %v", err)
	}

	if graph == nil {
		t.Fatal("expected non-nil graph")
	}

	if len(graph.Services) == 0 {
		t.Errorf("expected at least 1 service in sample-shop")
	}

	// Verify orders service exists
	if _, ok := graph.Services["orders"]; !ok {
		t.Errorf("missing orders service in compiled graph")
	}
}
