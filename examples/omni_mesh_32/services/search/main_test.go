package main

import "testing"

func TestPointIDIsStableAndDistinctPerSKU(t *testing.T) {
	if pointID("sku-1") != pointID("sku-1") {
		t.Fatalf("point id must be deterministic")
	}
	if pointID("sku-1") == pointID("sku-2") {
		t.Fatalf("different SKUs must map to different point ids")
	}
}
