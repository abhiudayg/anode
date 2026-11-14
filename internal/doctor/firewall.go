package doctor

import "github.com/abhiudayg/anode/internal/deployer"

func CheckAppPortFirewall(target string) CheckResult {
	client, err := deployer.DialSSH(target)
	if err != nil {
		return CheckResult{Category: CategoryRemote, Name: "App Port Firewall", Status: StatusWarn, Message: "could not connect to check the firewall rule"}
	}
	defer client.Close()

	if _, err := client.Run("iptables -C INPUT " + deployer.AppPortIptablesRule()); err != nil {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "App Port Firewall",
			Status:      StatusFail,
			Message:     "rule missing: application ports can be reached from the network",
			Remediation: "Run 'anode deploy' again to reinstall the rule.",
		}
	}
	if _, err := client.Run("grep -q 'dport 21040:21999' /etc/iptables/rules.v4"); err != nil {
		return CheckResult{
			Category:    CategoryRemote,
			Name:        "App Port Firewall",
			Status:      StatusWarn,
			Message:     "rule is active but not saved: it will be lost on reboot",
			Remediation: "Run 'anode deploy' again to save the rule.",
		}
	}
	return CheckResult{Category: CategoryRemote, Name: "App Port Firewall", Status: StatusOK, Message: "application ports are blocked from external interfaces and the rule is saved"}
}
