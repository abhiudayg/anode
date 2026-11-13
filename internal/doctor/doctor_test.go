package doctor

import (
	"context"
	"errors"
	"net"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func TestParseGoVersion(t *testing.T) {
	tests := []struct {
		raw      string
		expected versionTuple
		valid    bool
	}{
		{"go version go1.27.3 darwin/arm64", versionTuple{1, 27, 3}, true},
		{"go1.28.0 linux/amd64", versionTuple{1, 28, 0}, true},
		{"go1.26 darwin/amd64", versionTuple{1, 26, 0}, true},
		{"invalid", versionTuple{}, false},
	}

	for _, tt := range tests {
		got, ok := parseGoVersion(tt.raw)
		if ok != tt.valid {
			t.Errorf("parseGoVersion(%q) valid = %v; want %v", tt.raw, ok, tt.valid)
		}
		if ok && got != tt.expected {
			t.Errorf("parseGoVersion(%q) = %+v; want %+v", tt.raw, got, tt.expected)
		}
	}
}

func TestVersionCompare(t *testing.T) {
	v1273 := versionTuple{1, 27, 3}
	v1270 := versionTuple{1, 27, 0}
	v1280 := versionTuple{1, 28, 0}
	v1269 := versionTuple{1, 26, 9}

	if v1273.compare(v1270) <= 0 {
		t.Errorf("v1.27.3 should be > v1.27.0")
	}
	if v1273.compare(v1280) >= 0 {
		t.Errorf("v1.27.3 should be < v1.28.0")
	}
	if v1273.compare(v1269) <= 0 {
		t.Errorf("v1.27.3 should be > v1.26.9")
	}
	if v1273.compare(v1273) != 0 {
		t.Errorf("v1.27.3 should equal v1.27.3")
	}
}

func TestCheckLoopbackAllocation(t *testing.T) {
	res := CheckLoopbackAllocation()
	if res.Status != StatusOK {
		t.Errorf("expected CheckLoopbackAllocation to pass, got: %+v", res)
	}
}

func TestCheckCommonDevPorts(t *testing.T) {
	res := CheckCommonDevPorts()
	if res.Status != StatusOK {
		t.Errorf("expected CheckCommonDevPorts to return StatusOK, got: %+v", res)
	}
}

func TestCheckContainerRuntimeTopologyAware(t *testing.T) {
	tmpDir, err := os.MkdirTemp("", "anode-stateless-*")
	if err != nil {
		t.Fatal(err)
	}
	defer os.RemoveAll(tmpDir)

	// In an empty/stateless directory, container engine is not required
	res := CheckContainerRuntime(context.Background(), tmpDir)
	if res.Status != StatusOK {
		t.Errorf("expected StatusOK for stateless directory, got %+v", res)
	}
	if !strings.Contains(res.Message, "Not required") {
		t.Errorf("expected 'Not required' message for stateless, got %q", res.Message)
	}
}

func TestReportTallyAndFailure(t *testing.T) {
	r := &Report{}
	r.Add(CheckResult{Category: "TEST", Name: "Check1", Status: StatusOK})
	r.Add(CheckResult{Category: "TEST", Name: "Check2", Status: StatusWarn})

	if r.TotalPassed != 1 || r.TotalWarned != 1 || r.TotalFailed != 0 {
		t.Fatalf("unexpected tallies: %+v", r)
	}
	if r.HasFailed() {
		t.Errorf("report should not fail on warning when strict=false")
	}

	r.Strict = true
	if !r.HasFailed() {
		t.Errorf("report should fail on warning when strict=true")
	}

	r.Strict = false
	r.Add(CheckResult{Category: "TEST", Name: "Check3", Status: StatusFail})
	if !r.HasFailed() {
		t.Errorf("report must fail when totalFailed > 0")
	}
}

func TestClassifySSHError(t *testing.T) {
	target := "root@192.168.1.50"

	// 1. Missing keys
	resKey := classifySSHError(target, errors.New("no_ssh_keys_found"))
	if resKey.Status != StatusFail || resKey.Category != CategoryRemote {
		t.Errorf("expected key error fail, got %+v", resKey)
	}

	// 2. DNS error
	resDNS := classifySSHError(target, &net.DNSError{Err: "no such host", Name: "bad.target.local"})
	if resDNS.Status != StatusFail || resDNS.Name != "SSH Connectivity (DNS Failure)" {
		t.Errorf("expected DNS failure, got %+v", resDNS)
	}

	// 3. Timeout error
	resTimeout := classifySSHError(target, errors.New("dial tcp 192.168.1.50:22: i/o timeout"))
	if resTimeout.Status != StatusFail || resTimeout.Name != "SSH Connectivity (Port 22 Timeout)" {
		t.Errorf("expected Timeout failure, got %+v", resTimeout)
	}

	// 4. Auth rejected
	resAuth := classifySSHError(target, errors.New("ssh: handshake failed: ssh: unable to authenticate, attempted methods [publickey], no supported methods remain"))
	if resAuth.Status != StatusFail || resAuth.Name != "SSH Connectivity (Auth Rejected)" {
		t.Errorf("expected Auth rejection, got %+v", resAuth)
	}
}

func TestClassifyTCPError(t *testing.T) {
	target := "root@vps.anode.dev"
	host := "vps.anode.dev:22"

	// 1. DNS error
	resDNS := classifyTCPError(target, host, &net.DNSError{Err: "no such host", Name: "vps.anode.dev"})
	if resDNS.Status != StatusFail || resDNS.Name != "Raw TCP Dial (DNS Failure)" {
		t.Errorf("expected Raw TCP DNS failure, got %+v", resDNS)
	}

	// 2. Timeout error
	resTimeout := classifyTCPError(target, host, errors.New("dial tcp: i/o timeout"))
	if resTimeout.Status != StatusFail || resTimeout.Name != "Raw TCP Dial (Port 22 Timeout)" {
		t.Errorf("expected Raw TCP Timeout failure, got %+v", resTimeout)
	}

	// 3. Connection refused
	resRefused := classifyTCPError(target, host, errors.New("dial tcp: connection refused"))
	if resRefused.Status != StatusFail || resRefused.Name != "Raw TCP Dial (Connection Refused)" {
		t.Errorf("expected Raw TCP Refused failure, got %+v", resRefused)
	}
}

func TestParseUserAndHost(t *testing.T) {
	u1, h1 := parseUserAndHost("root@example.com")
	if u1 != "root" || h1 != "example.com:22" {
		t.Errorf("got %s, %s", u1, h1)
	}

	u2, h2 := parseUserAndHost("deploy@1.2.3.4:2222")
	if u2 != "deploy" || h2 != "1.2.3.4:2222" {
		t.Errorf("got %s, %s", u2, h2)
	}

	u3, h3 := parseUserAndHost("myvps.internal")
	if u3 != "root" || h3 != "myvps.internal:22" {
		t.Errorf("got %s, %s", u3, h3)
	}
}

func TestDoctorRunOnExample(t *testing.T) {
	// Find examples/sample-shop
	cwd, err := os.Getwd()
	if err != nil {
		t.Fatal(err)
	}

	targetDir := filepath.Join(cwd, "..", "..", "examples", "sample-shop")
	if _, err := os.Stat(targetDir); err != nil {
		t.Skip("skipping example check; directory not found:", targetDir)
	}

	opts := Options{
		TargetDir: targetDir,
		Strict:    false,
	}

	rep, err := Run(context.Background(), opts)
	if err != nil {
		t.Fatalf("doctor Run returned error: %v", err)
	}

	if len(rep.Results) == 0 {
		t.Fatalf("expected results in doctor report, got 0")
	}

	for _, r := range rep.Results {
		if r.Category == CategoryTopology && r.Name == "Contract Verification" {
			if r.Status != StatusOK {
				t.Errorf("sample-shop contract verification should pass, got: %+v", r)
			}
		}
	}
}
