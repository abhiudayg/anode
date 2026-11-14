package deployer

import (
	"reflect"
	"testing"
)

func TestAllocateServicePortsKeepsRegisteredPorts(t *testing.T) {
	got, err := allocateServicePorts([]string{"orders", "payments"}, map[string]int{"orders": 21045, "payments": 21041}, nil)
	if err != nil {
		t.Fatal(err)
	}
	want := map[string]int{"orders": 21045, "payments": 21041}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestAllocateServicePortsAvoidsForeignListeners(t *testing.T) {
	got, err := allocateServicePorts([]string{"hello"}, nil, map[int]bool{21040: true})
	if err != nil {
		t.Fatal(err)
	}
	if got["hello"] != 21041 {
		t.Errorf("hello got port %d, want 21041 (21040 is held by another process)", got["hello"])
	}
}

func TestAllocateServicePortsMovesRegisteredPortWhenForeignProcessHoldsIt(t *testing.T) {
	got, err := allocateServicePorts([]string{"orders"}, map[string]int{"orders": 21040}, map[int]bool{21040: true})
	if err != nil {
		t.Fatal(err)
	}
	if got["orders"] == 21040 {
		t.Errorf("orders kept a port held by a foreign process")
	}
}

func TestParsePortRegistryIgnoresMalformedLines(t *testing.T) {
	got := parsePortRegistry("orders 21040\nbroken\npayments notaport\nhello 70000\n")
	want := map[string]int{"orders": 21040}
	if !reflect.DeepEqual(got, want) {
		t.Errorf("got %v, want %v", got, want)
	}
}

func TestListeningPortsReadsSSOutput(t *testing.T) {
	out := "LISTEN 0 4096 127.0.0.1:21040 0.0.0.0:*\nLISTEN 0 4096 *:80 *:*\nLISTEN 0 4096 [::]:22 [::]:*\n"
	got := listeningPorts(out)
	for _, port := range []int{21040, 80, 22} {
		if !got[port] {
			t.Errorf("port %d not detected in %v", port, got)
		}
	}
}

func TestFormatPortRegistryRoundTrips(t *testing.T) {
	assigned := map[string]int{"payments": 21041, "orders": 21040}
	text := formatPortRegistry(assigned)
	if text != "orders 21040\npayments 21041\n" {
		t.Errorf("unexpected registry text %q", text)
	}
	if !reflect.DeepEqual(parsePortRegistry(text), assigned) {
		t.Errorf("registry did not round-trip")
	}
}
