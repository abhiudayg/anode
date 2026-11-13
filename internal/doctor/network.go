package doctor

import (
	"fmt"
	"net"
)

const CategoryNetwork = "LOCAL RUNTIME & NETWORKING"

// CheckLoopbackAllocation verifies dynamic ephemeral loopback socket allocation.
func CheckLoopbackAllocation() CheckResult {
	// Attempt to bind an ephemeral port on 127.0.0.1
	l1, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return CheckResult{
			Category:    CategoryNetwork,
			Name:        "Dynamic Loopback Subnet",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Failed to bind ephemeral socket on 127.0.0.1: %v", err),
			Remediation: "Ensure your OS loopback interface ('lo' or 'lo0') is active and unrestricted by host firewall policies.",
		}
	}
	defer l1.Close()

	port1 := l1.Addr().(*net.TCPAddr).Port

	// Attempt a second concurrent binding to ensure collision-free kernel allocation
	l2, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		return CheckResult{
			Category:    CategoryNetwork,
			Name:        "Dynamic Loopback Subnet",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Second loopback binding failed: %v", err),
			Remediation: "Check OS ephemeral socket limits: 'sysctl net.inet.ip.portrange' or ulimit -n.",
		}
	}
	defer l2.Close()

	port2 := l2.Addr().(*net.TCPAddr).Port

	if port1 == port2 {
		return CheckResult{
			Category:    CategoryNetwork,
			Name:        "Dynamic Loopback Subnet",
			Status:      StatusFail,
			Message:     fmt.Sprintf("Kernel collision: identical ephemeral port %d allocated twice", port1),
			Remediation: "Kernel TCP stack error; reboot or verify network socket configuration.",
		}
	}

	return CheckResult{
		Category: CategoryNetwork,
		Name:     "Dynamic Loopback Subnet",
		Status:   StatusOK,
		Message:  fmt.Sprintf("Kernel 127.0.0.1 dynamic socket allocation verified (ports :%d, :%d allocated freely)", port1, port2),
	}
}

// CheckCommonDevPorts inspects whether standard development ports are already in use.
func CheckCommonDevPorts() CheckResult {
	ports := []struct {
		port int
		name string
	}{
		{5432, "PostgreSQL default"},
		{6379, "Redis default"},
		{3306, "MySQL default"},
		{8080, "Default web listener"},
	}

	var occupied []string
	for _, p := range ports {
		l, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", p.port))
		if err != nil {
			occupied = append(occupied, fmt.Sprintf(":%d (%s)", p.port, p.name))
		} else {
			_ = l.Close()
		}
	}

	if len(occupied) > 0 {
		return CheckResult{
			Category: CategoryNetwork,
			Name:     "Host Port Isolation",
			Status:   StatusOK,
			Message:  fmt.Sprintf("Host ports in use: %v — Anode loopback isolation prevents conflict with these", occupied),
		}
	}

	return CheckResult{
		Category: CategoryNetwork,
		Name:     "Host Port Isolation",
		Status:   StatusOK,
		Message:  "Standard database and web ports (:5432, :6379, :3306, :8080) are completely clear",
	}
}
