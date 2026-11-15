package catalog

import (
	"bytes"
	"fmt"
	"sort"
	"strconv"
	"strings"
	"text/template"
)

// DriverSpec defines the complete lifecycle, security boundary, and connection matrix for a stateful resource kind.
type DriverSpec struct {
	Kind              string                 `yaml:"kind" json:"kind"`
	Category          string                 `yaml:"category" json:"category"`
	DefaultVersion    string                 `yaml:"default_version" json:"default_version"`
	SupportedVersions map[string]VersionSpec `yaml:"supported_versions,omitempty" json:"supported_versions,omitempty"`
	Runtime           RuntimeSpec            `yaml:"runtime" json:"runtime"`
	Security          SecuritySpec           `yaml:"security" json:"security"`
	Networking        NetworkingSpec         `yaml:"networking" json:"networking"`
	ConnectionEnv     map[string]string      `yaml:"connection_templates" json:"connection_templates"`
	PrimaryConnection string                 `yaml:"primary_connection,omitempty" json:"primary_connection,omitempty"`
	ReadinessProbe    ReadinessSpec          `yaml:"readiness_probe" json:"readiness_probe"`
}

type VersionSpec struct {
	Image     string            `yaml:"image" json:"image"`
	Command   []string          `yaml:"command,omitempty" json:"command,omitempty"`
	ExtraEnv  map[string]string `yaml:"extra_env,omitempty" json:"extra_env,omitempty"`
	EndOfLife bool              `yaml:"end_of_life,omitempty" json:"end_of_life,omitempty"`
	Notes     string            `yaml:"notes,omitempty" json:"notes,omitempty"`
}

type RuntimeSpec struct {
	ImageTemplate string            `yaml:"image_template" json:"image_template"`
	Command       []string          `yaml:"command,omitempty" json:"command,omitempty"`
	DataMount     string            `yaml:"data_mount" json:"data_mount"`
	DefaultEnv    map[string]string `yaml:"default_env,omitempty" json:"default_env,omitempty"`
	PasswordEnv   string            `yaml:"password_env,omitempty" json:"password_env,omitempty"`
}

type SecuritySpec struct {
	UID              int          `yaml:"uid" json:"uid"`
	GID              int          `yaml:"gid" json:"gid"`
	FileMode         string       `yaml:"file_mode" json:"file_mode"`
	NoNewPrivileges  bool         `yaml:"no_new_privileges" json:"no_new_privileges"`
	DropCapabilities []string     `yaml:"drop_capabilities,omitempty" json:"drop_capabilities,omitempty"`
	AddCapabilities  []string     `yaml:"add_capabilities,omitempty" json:"add_capabilities,omitempty"`
	OOMScoreAdjust   int          `yaml:"oom_score_adjust" json:"oom_score_adjust"`
	Cgroups          CgroupsLimit `yaml:"cgroups" json:"cgroups"`
}

type CgroupsLimit struct {
	MemoryMax string `yaml:"memory_max" json:"memory_max"`
	CPUQuota  string `yaml:"cpu_quota" json:"cpu_quota"`
}

type NetworkingSpec struct {
	PrimaryPort   int    `yaml:"primary_port" json:"primary_port"`
	BindInterface string `yaml:"bind_interface" json:"bind_interface"`
	Protocol      string `yaml:"protocol" json:"protocol"`
}

type ReadinessSpec struct {
	Command         []string `yaml:"command,omitempty" json:"command,omitempty"`
	TCPPort         int      `yaml:"tcp_port,omitempty" json:"tcp_port,omitempty"`
	HTTPPath        string   `yaml:"http_path,omitempty" json:"http_path,omitempty"`
	InitialDelaySec int      `yaml:"initial_delay_sec" json:"initial_delay_sec"`
	TimeoutSec      int      `yaml:"timeout_sec" json:"timeout_sec"`
}

// ResolveImage resolves the concrete container image for a given version.
func (d *DriverSpec) ResolveImage(version string) string {
	targetVer := version
	if targetVer == "" {
		targetVer = d.DefaultVersion
	}

	// 1. Check explicit pinned versions
	if vSpec, exists := d.SupportedVersions[targetVer]; exists && vSpec.Image != "" {
		return vSpec.Image
	}

	// 2. Render image template with target version
	if d.Runtime.ImageTemplate != "" {
		tmpl, err := template.New("img").Parse(d.Runtime.ImageTemplate)
		if err == nil {
			var buf bytes.Buffer
			_ = tmpl.Execute(&buf, map[string]string{"Version": targetVer})
			return buf.String()
		}
	}

	return fmt.Sprintf("%s:%s", d.Kind, targetVer)
}

// BuildProvisionCommand synthesizes the Docker/Podman execution command enforcing least privilege.
func (d *DriverSpec) BuildProvisionCommand(resName string, version string, dataDir string, envFile string) string {
	image := d.ResolveImage(version)
	containerName := fmt.Sprintf("anode-%s", resName)

	bindAddr := d.Networking.BindInterface
	if bindAddr == "" {
		bindAddr = "127.0.0.1" // Least privilege: always bind to loopback by default
	}

	envFlags := ""
	if envFile != "" {
		envFlags = fmt.Sprintf(" --env-file '%s'", envFile)
	}

	// Build security hardening flags
	var secFlags strings.Builder
	if d.Security.NoNewPrivileges {
		secFlags.WriteString(" --security-opt no-new-privileges:true")
	}
	if len(d.Security.DropCapabilities) > 0 {
		for _, cap := range d.Security.DropCapabilities {
			secFlags.WriteString(fmt.Sprintf(" --cap-drop=%s", cap))
		}
	}
	if len(d.Security.AddCapabilities) > 0 {
		for _, cap := range d.Security.AddCapabilities {
			secFlags.WriteString(fmt.Sprintf(" --cap-add=%s", cap))
		}
	}
	if d.Security.Cgroups.MemoryMax != "" {
		secFlags.WriteString(fmt.Sprintf(" --memory=%s", d.Security.Cgroups.MemoryMax))
	}
	if d.Security.Cgroups.CPUQuota != "" {
		secFlags.WriteString(fmt.Sprintf(" --cpus=%s", cpusFromQuota(d.Security.Cgroups.CPUQuota)))
	}
	if d.Security.OOMScoreAdjust != 0 {
		secFlags.WriteString(fmt.Sprintf(" --oom-score-adj=%d", d.Security.OOMScoreAdjust))
	}

	// Directory setup with deterministic POSIX permissions
	uid := d.Security.UID
	if uid == 0 {
		uid = 999
	}
	gid := d.Security.GID
	if gid == 0 {
		gid = uid
	}
	mode := d.Security.FileMode
	if mode == "" {
		mode = "0700" // Least privilege default
	}

	setupDirCmd := fmt.Sprintf("install -d -m %s -o %d -g %d '%s'", mode, uid, gid, dataDir)

	commandArgs := ""
	if len(d.Runtime.Command) > 0 {
		commandArgs = " " + strings.Join(d.Runtime.Command, " ")
	}

	runCmd := fmt.Sprintf(`(%s && docker ps -q -f 'name=^/%s$' | grep -q . || docker run -d \
		--name '%s' \
		--restart always \
		-p %s:%d:%d \
		-v '%s:%s' \
		%s%s \
		%s%s)`,
		setupDirCmd,
		containerName,
		containerName,
		bindAddr, d.Networking.PrimaryPort, d.Networking.PrimaryPort,
		dataDir, d.Runtime.DataMount,
		secFlags.String(),
		envFlags,
		image,
		commandArgs,
	)

	return runCmd
}

// BuildConnectionEnv evaluates templates to produce environment variables for a consuming service.
func (d *DriverSpec) BuildConnectionEnv(resName string, host string, port int, dbName string, password string) map[string]string {
	if host == "" {
		host = "127.0.0.1"
	}
	if port == 0 {
		port = d.Networking.PrimaryPort
	}
	if dbName == "" {
		dbName = resName
	}

	data := map[string]string{
		"Host":     host,
		"Port":     fmt.Sprintf("%d", port),
		"Database": dbName,
		"User":     "postgres",
		"Password": password,
		"Protocol": d.Networking.Protocol,
	}

	result := make(map[string]string)
	for key, tmplStr := range d.ConnectionEnv {
		tmpl, err := template.New(key).Parse(tmplStr)
		if err == nil {
			var buf bytes.Buffer
			if err := tmpl.Execute(&buf, data); err == nil {
				result[key] = buf.String()
			}
		}
	}

	return result
}

func (d *DriverSpec) RuntimeEnvFile(resName string, password string) string {
	env := make(map[string]string, len(d.Runtime.DefaultEnv)+1)
	for k, v := range d.Runtime.DefaultEnv {
		v = strings.ReplaceAll(v, "${RESOURCE_ID}", resName)
		env[k] = strings.ReplaceAll(v, "${DB_NAME}", resName)
	}
	if d.Runtime.PasswordEnv != "" {
		env[d.Runtime.PasswordEnv] = password
	}
	keys := make([]string, 0, len(env))
	for k := range env {
		keys = append(keys, k)
	}
	sort.Strings(keys)
	var b strings.Builder
	for _, k := range keys {
		fmt.Fprintf(&b, "%s=%s\n", k, env[k])
	}
	return b.String()
}

func cpusFromQuota(quota string) string {
	percent, err := strconv.ParseFloat(strings.TrimSuffix(quota, "%"), 64)
	if err != nil {
		return quota
	}
	return strconv.FormatFloat(percent/100, 'f', -1, 64)
}

func (d *DriverSpec) ReadinessCommand(resName string) string {
	if len(d.ReadinessProbe.Command) == 0 {
		return ""
	}
	return fmt.Sprintf("for i in $(seq 1 60); do docker exec 'anode-%s' %s >/dev/null 2>&1 && exit 0; sleep 2; done; exit 1",
		resName, strings.Join(d.ReadinessProbe.Command, " "))
}

func (d *DriverSpec) PrimaryConnectionValue(resName, host string, port int, dbName, password string) (string, error) {
	if d.PrimaryConnection == "" {
		return "", fmt.Errorf("catalog kind %s has no primary_connection", d.Kind)
	}
	value, ok := d.BuildConnectionEnv(resName, host, port, dbName, password)[d.PrimaryConnection]
	if !ok {
		return "", fmt.Errorf("catalog kind %s: primary_connection %s is not a connection template", d.Kind, d.PrimaryConnection)
	}
	return value, nil
}
