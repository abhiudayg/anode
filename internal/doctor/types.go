package doctor

// Status represents the outcome of an individual diagnostic check.
type Status string

const (
	StatusOK   Status = "OK"
	StatusWarn Status = "WARN"
	StatusFail Status = "FAIL"
)

// CheckResult contains detailed findings and optional remediation advice.
type CheckResult struct {
	Category    string `json:"category"`
	Name        string `json:"name"`
	Status      Status `json:"status"`
	Message     string `json:"message"`
	Remediation string `json:"remediation,omitempty"`
}

// Options configure the scope and behavior of the doctor linter.
type Options struct {
	TargetDir    string
	RemoteTarget string
	Strict       bool
	Verbose      bool
}

// Report aggregates all diagnostic findings and summary metrics.
type Report struct {
	Results     []CheckResult `json:"results"`
	TotalPassed int           `json:"total_passed"`
	TotalWarned int           `json:"total_warned"`
	TotalFailed int           `json:"total_failed"`
	Strict      bool          `json:"strict"`
}

// Add appends a result and updates tally counts.
func (r *Report) Add(res CheckResult) {
	r.Results = append(r.Results, res)
	switch res.Status {
	case StatusOK:
		r.TotalPassed++
	case StatusWarn:
		r.TotalWarned++
	case StatusFail:
		r.TotalFailed++
	}
}

// HasFailed determines whether the overall run should exit with failure.
func (r *Report) HasFailed() bool {
	if r.TotalFailed > 0 {
		return true
	}
	if r.Strict && r.TotalWarned > 0 {
		return true
	}
	return false
}
