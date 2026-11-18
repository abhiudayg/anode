"use client";


export default function ChapterLockfileSpec() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Contract Specification
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    The anode.lock.json Specification
                  </h2>
                  <p className="text-sm text-neutral-300">
                    The lockfile is the definitive, reviewable representation of your application&apos;s infrastructure topology. It is committed directly to Git.
                  </p>

                  <div className="relative">
                    <pre className="p-5 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                      <code>{`{
    "schema_version": "1.0",
    "commit_sha": "b48bf5c",
    "resources": {
      "db-orders": {
        "kind": "postgres",
        "engine_version": "16",
        "lifecycle": "stateful_retain",
        "auto_provision": true,
        "provenance": "services/orders/main.go:40",
        "migrations": {
          "tool": "goose",
          "path": "migrations/orders",
          "execution": "pre_traffic_job"
        }
      }
    },
    "services": {
      "orders": {
        "name": "orders",
        "entrypoint": "./services/orders",
        "ingress": [
          {
            "protocol": "http",
            "port_env": "PORT",
            "routes": ["POST /v1/orders"]
          }
        ],
        "bindings": [
          {
            "resource_ref": "db-orders",
            "protocol": "postgres",
            "inject_env": "DATABASE_URL",
            "expanded_env": ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"],
            "provenance": "services/orders/main.go:40"
          }
        ]
      }
    },
    "egress_rules": [
      {
        "source_service": "orders",
        "target_host": "https://api.stripe.com/v1/charges",
        "port": 443,
        "protocol": "https",
        "is_external": true
      }
    ],
    "diagnostics": []
  }`}</code>
                    </pre>
                  </div>
                </div>
  );
}
