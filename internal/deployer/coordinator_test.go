package deployer_test

import (
	"strings"
	"testing"

	"github.com/abhiudayg/anode/internal/deployer"
	"github.com/abhiudayg/anode/internal/iag"
)

func TestCleanDomainAndCaddyAddress(t *testing.T) {
	tests := []struct {
		name       string
		rawDomain  string
		expectSite string
	}{
		{
			name:       "Plain IP Address",
			rawDomain:  "192.168.139.166",
			expectSite: "http://192.168.139.166:80 {",
		},
		{
			name:       "User and Host with Port",
			rawDomain:  "root@api.example.com:22",
			expectSite: "api.example.com {",
		},
		{
			name:       "Localhost",
			rawDomain:  "localhost",
			expectSite: "http://localhost:80 {",
		},
		{
			name:       "User and IP Address",
			rawDomain:  "admin@10.0.0.1",
			expectSite: "http://10.0.0.1:80 {",
		},
		{
			name:       "Standard FQDN",
			rawDomain:  "shop.production.net",
			expectSite: "shop.production.net {",
		},
	}

	dummyLock := &iag.LockFile{
		Services: map[string]iag.Service{
			"web": {
				Name: "web",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						Routes:   []string{"GET /"},
					},
				},
			},
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			out := deployer.GenerateCaddyfile(tc.rawDomain, dummyLock, map[string]int{"web": 8080})
			if !strings.Contains(out, tc.expectSite) {
				t.Fatalf("expected site %q in Caddyfile, got:\n%s", tc.expectSite, out)
			}
		})
	}
}

func TestSystemdSecurityDirectives(t *testing.T) {
	cfg := deployer.SystemdUnitConfig{
		ServiceName: "orders",
		Description: "Production Orders Service",
		ExecStart:   "/var/lib/anode/releases/100/orders",
		WorkingDir:  "/var/lib/anode/releases/100",
		EnvVars: map[string]string{
			"PORT": "21040",
		},
	}

	unit, err := deployer.GenerateSystemdUnit(cfg)
	if err != nil {
		t.Fatalf("GenerateSystemdUnit failed: %v", err)
	}

	requiredDirectives := []string{
		"User=anode",
		"DynamicUser=yes",
		"NoNewPrivileges=true",
		"ProtectSystem=strict",
		"ProtectHome=true",
		"PrivateTmp=true",
		"PrivateDevices=true",
		"ProtectKernelTunables=true",
		"ProtectControlGroups=true",
		"ProtectKernelModules=true",
		"ProtectKernelLogs=true",
		"ProtectClock=true",
		"RestrictSUIDSGID=true",
		"RestrictRealtime=true",
		"RestrictNamespaces=true",
		"LockPersonality=true",
		"MemoryDenyWriteExecute=true",
		"RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6",
		"ProtectProc=invisible",
		"SystemCallArchitectures=native",
		"ReadWritePaths=/var/lib/anode/releases/100",
		"CPUQuota=200%",
		"MemoryMax=1G",
		"Restart=always",
	}

	for _, directive := range requiredDirectives {
		if !strings.Contains(unit, directive) {
			t.Errorf("missing expected security directive: %s", directive)
		}
	}
}

func TestMultiServiceCaddyfileRouting(t *testing.T) {
	lockfile := &iag.LockFile{
		Services: map[string]iag.Service{
			"orders": {
				Name: "orders",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						Routes:   []string{"POST /v1/orders", "GET /v1/orders/{id}"},
					},
				},
			},
			"payments": {
				Name: "payments",
				Ingress: []iag.Ingress{
					{
						Protocol: "http",
						Routes:   []string{"POST /v1/charges"},
					},
				},
			},
		},
	}

	portMap := map[string]int{
		"orders":   21040,
		"payments": 21041,
	}

	caddyfile := deployer.GenerateCaddyfile("api.store.com", lockfile, portMap)

	if !strings.Contains(caddyfile, "api.store.com {") {
		t.Errorf("missing site declaration")
	}
	if !strings.Contains(caddyfile, "reverse_proxy 127.0.0.1:21040") {
		t.Errorf("missing orders reverse proxy on port 21040")
	}
	if !strings.Contains(caddyfile, "reverse_proxy 127.0.0.1:21041") {
		t.Errorf("missing payments reverse proxy on port 21041")
	}
}
