"use client";

import {
} from "lucide-react";

export default function ChapterDevEngine() {
  return (
              <div className="block space-y-6 leading-relaxed">
                <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/[0.1]">
                  Local orchestration
                </span>
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Dynamic ports and the local engine</h2>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  <code className="text-neutral-200">anode dev</code> runs the services from the lockfile on your machine. It is implemented in <code className="text-neutral-200">internal/devengine/</code>. Its job is to avoid fixed host ports, so two projects, or a local PostgreSQL, cannot collide.
                </p>

                <h3 className="text-lg font-bold text-white mt-8">Free-port allocation</h3>
                <p className="text-sm text-neutral-300 leading-relaxed">
                  Each service and each database container gets a loopback port that the OS chooses: the engine asks for a free port on 127.0.0.1 (port 0). The port is free when it is read, and nothing reserves it afterwards. Redis is the one exception: dev uses the fixed address 127.0.0.1:6379.
                </p>
                <pre className="rounded-xl border border-white/[0.08] bg-[#050507] p-4 text-xs font-mono-code text-neutral-300 overflow-x-auto whitespace-pre">{`// internal/devengine/engine.go (simplified)
  l, _ := net.ListenTCP("tcp", &net.TCPAddr{IP: net.ParseIP("127.0.0.1"), Port: 0})
  port := l.Addr().(*net.TCPAddr).Port`}</pre>

                <h3 className="text-lg font-bold text-white mt-8">What each service receives</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <li>A database DSN for each binding, using fixed development credentials (<code className="text-neutral-200">postgres:postgres</code>). Do not reuse these outside dev.</li>
                  <li>The components listed in the binding&apos;s <code className="text-neutral-200">expanded_env</code>, such as <code className="text-neutral-200">DB_HOST=127.0.0.1</code> and <code className="text-neutral-200">DB_PORT</code> set to the container&apos;s host port.</li>
                  <li>For each service it calls, that service&apos;s loopback URL, in the environment variable named by the lockfile binding.</li>
                  <li>Its own listen port, in the variable named by <code className="text-neutral-200">port_env</code> (for example <code className="text-neutral-200">PORT</code>).</li>
                </ul>

                <h3 className="text-lg font-bold text-white mt-8">What dev does not do</h3>
                <ul className="list-disc list-inside space-y-2 text-sm text-neutral-300 leading-relaxed">
                  <li>It does not put a proxy in front of your services. Each service listens on the loopback port assigned to it.</li>
                  <li>It does not match production. Stores run in containers on your machine (Docker or Podman), and the credentials are the fixed dev ones.</li>
                  <li>Database containers need a container engine. Without one, the database has to be provided another way.</li>
                </ul>
                <p className="text-xs font-mono-code text-neutral-500">Source: docs/architecture.md, section 4 (local engine); internal/devengine/engine.go, container.go</p>
              </div>
  );
}
