"use client";


export default function ChapterSystemdVps() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                    Production VPS Deployer
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Bare-Metal Systemd & Cgroups v2
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Anode turns standard Linux VPS instances (Hetzner, OVH, DigitalOcean) into production-grade orchestration nodes without Kubernetes or Docker daemon overhead.
                  </p>

                  <h3 className="text-base font-bold text-white">Generated Systemd Unit File</h3>
                  <p className="text-xs text-neutral-400">
                    Located at <code className="text-neutral-200 font-mono-code">/etc/systemd/system/anode-&lt;service&gt;.service</code>:
                  </p>

                  <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto leading-relaxed">
                    <code>{`[Unit]
  Description=Anode Managed: shop-api
  After=network.target

  [Service]
  Type=simple
  User=anode
  Group=anode
  WorkingDirectory=/opt/anode/releases/shop-api/current
  ExecStart=/opt/anode/releases/shop-api/current/shop-api
  Restart=always
  RestartSec=3

  # Linux cgroups v2 Kernel Resource Quotas
  CPUQuota=200%
  MemoryMax=1G

  # Security Sandboxing
  NoNewPrivileges=true
  ProtectSystem=strict
  ProtectHome=true

  [Install]
  WantedBy=multi-user.target`}</code>
                  </pre>

                  <h3 className="text-base font-bold text-white pt-2">Restart on Deploy</h3>
                  <div className="space-y-2 text-xs text-neutral-300 pl-4 border-l-2 border-white/[0.15]">
                    <p>1. Anode uploads the new static Linux executable and writes its systemd unit.</p>
                    <p>2. Restarts the service with <code className="text-neutral-200">systemctl restart</code> and checks GET /healthz until it returns a status from 200 to 399.</p>
                    <p>3. Writes the Caddy configuration for the service and reloads Caddy.</p>
                    <p>4. The restart is in place. Connections open when the service restarts are dropped, so each deploy has a short outage for that service.</p>
                  </div>
                </div>
  );
}
