package main

import "testing"

func TestParseVector(t *testing.T) {
	got, err := parseVector("0.1, 0.2,0.3")
	if err != nil || len(got) != 3 || got[1] != 0.2 {
		t.Fatalf("parseVector = %v, %v", got, err)
	}
	if _, err := parseVector(""); err == nil {
		t.Errorf("empty vector must be rejected")
	}
	if _, err := parseVector("0.1,abc"); err == nil {
		t.Errorf("non-numeric component must be rejected")
	}
}
