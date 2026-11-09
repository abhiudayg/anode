# Project Verification (`.verify/`)

Layout follows the agstack verification skill.

```text
.verify/
├── verify.toml        allowlist of trusted commands
├── run.sh             runner: doctor, unit, static, functional
├── doctor.sh          optional read-only environment checks (create it to enable)
├── static.sh          optional static checks (create it to enable)
├── functional/        optional functional suites; functional/run.sh runs when present
└── artifacts/         one folder per run, kept after the run
```

## Usage
- Run the whole suite: `agent-brain verify -- .verify/run.sh`
- Run one feature: `agent-brain verify -- .verify/run.sh <feature>`
- Each run writes `summary.txt` and one log per phase under `.verify/artifacts/<RUN_ID>/`.
- Allowlisted runs are recorded into the local brain database, and `agent-brain verify receipt` shows the result for the current commit.
- Edit `verify.toml` to change the allowlist. Commands outside it are not evidence.
