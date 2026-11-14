package main

import "testing"

func TestScoreFlagsLargeAmountsAndMissingRegion(t *testing.T) {
	cases := []struct {
		name  string
		in    check
		score int
		allow bool
	}{
		{"small and located", check{Amount: 1000, Region: "us"}, 0, true},
		{"large amount only", check{Amount: 600000, Region: "us"}, 40, true},
		{"missing region only", check{Amount: 1000}, 30, true},
		{"large and unlocated", check{Amount: 600000}, 70, false},
	}
	for _, tc := range cases {
		t.Run(tc.name, func(t *testing.T) {
			got := score(tc.in)
			if got.Score != tc.score || got.Allow != tc.allow {
				t.Fatalf("score(%+v) = %+v, want score %d allow %v", tc.in, got, tc.score, tc.allow)
			}
		})
	}
}
