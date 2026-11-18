"use client";

import {
  Database,
} from "lucide-react";

export default function ChapterCatalogDrivers() {
  return (
              <div className="block space-y-6 leading-relaxed">
                  <span className="text-[11px] font-mono-code px-2 py-0.5 rounded bg-blue-950/60 text-blue-400 border border-blue-800/40">
                    Infrastructure Catalog
                  </span>
                  <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Pluggable Stateful Infrastructure Catalog
                  </h2>
                  <p className="text-sm text-neutral-300">
                    Anode decouples database and broker provisioning from the core orchestrator using a declarative driver catalog. This scales cleanly to 100+ services without modifying compiler or deployer Go code.
                  </p>

                  <div className="p-4 rounded-xl border border-white/[0.08] bg-[#07080a] space-y-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Database className="w-4 h-4 text-white" />
                      25+ Pre-Audited Built-in Drivers
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-neutral-300">
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">Relational DBs:</span> PostgreSQL (14-17), MySQL (8.0, 8.4), MariaDB, CockroachDB, TimescaleDB.
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">In-Memory & Caches:</span> Redis (6, 7), Valkey, KeyDB, Dragonfly, Memcached.
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">Message Brokers:</span> Kafka (Redpanda engine), RabbitMQ, NATS.
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">Search & Analytics:</span> ClickHouse, Elasticsearch, OpenSearch, Meilisearch.
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">NoSQL & Document:</span> MongoDB, ScyllaDB, Cassandra.
                      </div>
                      <div className="p-3 rounded-lg bg-white/[0.02] border border-white/[0.05]">
                        <span className="font-bold text-white">Vector Stores & Object:</span> Qdrant, Chroma, Milvus, Weaviate, MinIO, Temporal.
                      </div>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-white pt-2">Zero-Code Extensibility: .anode/catalog.yaml</h3>
                  <p className="text-xs text-neutral-300">
                    Drop a YAML definition into your repository at <code className="text-white">.anode/catalog/my-db.yaml</code> to register internal databases or specialized configurations with zero recompilation:
                  </p>
                  <pre className="p-4 rounded-xl bg-[#06070a] border border-white/[0.08] font-mono-code text-xs text-neutral-200 overflow-x-auto">
                    <code>{`drivers:
    my-store:
      kind: my-store
      category: database
      default_version: "2.0"
      runtime:
        image_template: "internal-docker.corp/data/store:{{.Version}}"
        data_mount: "/var/lib/store/data"
      security:
        uid: 1000
        file_mode: "0700"
        no_new_privileges: true
        oom_score_adjust: -800
        cgroups:
          memory_max: "4G"
      networking:
        primary_port: 8080
        bind_interface: "127.0.0.1"
      connection_templates:
        STORE_ADDR: "{{.Host}}:{{.Port}}"
        STORE_URL: "http://{{.Host}}:{{.Port}}"`}</code>
                  </pre>
                </div>
  );
}
