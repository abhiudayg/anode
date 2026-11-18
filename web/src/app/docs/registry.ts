// Maps each docs section id to its chapter component. Keep in sync with nav.ts.
import type { ComponentType } from "react";
import ChapterOverview from "./chapters/overview";
import ChapterQuickstart from "./chapters/quickstart";
import ChapterCli from "./chapters/cli";
import ChapterSsaVta from "./chapters/ssa-vta";
import ChapterChokePoints from "./chapters/choke-points";
import ChapterLockfileSpec from "./chapters/lockfile-spec";
import ChapterDevEngine from "./chapters/dev-engine";
import ChapterSystemdVps from "./chapters/systemd-vps";
import ChapterCatalogDrivers from "./chapters/catalog-drivers";
import ChapterSecurityHardening from "./chapters/security-hardening";
import ChapterInfraAutomation from "./chapters/infra-automation";
import ChapterBenchmarksAnalysis from "./chapters/benchmarks-analysis";
import ChapterTradeoffs from "./chapters/tradeoffs";
import ChapterTroubleshooting from "./chapters/troubleshooting";

export const CHAPTERS: Record<string, ComponentType> = {
  "overview": ChapterOverview,
  "quickstart": ChapterQuickstart,
  "cli": ChapterCli,
  "ssa-vta": ChapterSsaVta,
  "choke-points": ChapterChokePoints,
  "lockfile-spec": ChapterLockfileSpec,
  "dev-engine": ChapterDevEngine,
  "systemd-vps": ChapterSystemdVps,
  "catalog-drivers": ChapterCatalogDrivers,
  "security-hardening": ChapterSecurityHardening,
  "infra-automation": ChapterInfraAutomation,
  "benchmarks-analysis": ChapterBenchmarksAnalysis,
  "tradeoffs": ChapterTradeoffs,
  "troubleshooting": ChapterTroubleshooting,
};
