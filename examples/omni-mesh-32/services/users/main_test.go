package main

import "testing"

func TestNewIDIsUniqueHex(t *testing.T) {
	a, err := newID()
	if err != nil {
		t.Fatal(err)
	}
	b, err := newID()
	if err != nil {
		t.Fatal(err)
	}
	if len(a) != 32 || a == b {
		t.Fatalf("newID = %q, %q; want two distinct 32-character ids", a, b)
	}
}
