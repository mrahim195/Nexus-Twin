import os from "node:os";
import si from "systeminformation";
import type { PlatformOs } from "@nexus-twin/types";

export interface OsIdentity {
  hostname: string;
  platform: PlatformOs;
  osVersion: string;
  architecture: string;
}

export async function collectOsInfo(): Promise<OsIdentity> {
  const [osInfo, system] = await Promise.all([
    si.osInfo().catch(() => null),
    si.system().catch(() => null),
  ]);

  const platformRaw = (osInfo?.platform || os.platform()).toLowerCase();
  let platform: PlatformOs = "unknown";
  if (platformRaw.includes("win")) platform = "windows";
  else if (platformRaw.includes("darwin") || platformRaw.includes("mac"))
    platform = "macos";
  else if (platformRaw.includes("linux")) platform = "linux";

  return {
    hostname: osInfo?.hostname || os.hostname(),
    platform,
    osVersion:
      osInfo?.distro && osInfo?.release
        ? `${osInfo.distro} ${osInfo.release}`
        : osInfo?.release || os.release(),
    architecture: osInfo?.arch || os.arch(),
  };
}

export function aggregateApplications(
  processes: Array<{ name: string; cpuPercent: number | null; memoryBytes: number | null }>
) {
  const map = new Map<
    string,
    { name: string; processCount: number; cpuPercent: number; memoryBytes: number }
  >();

  for (const p of processes) {
    const base = p.name.replace(/\.(exe|app)$/i, "");
    const key = base.toLowerCase();
    const existing = map.get(key);
    if (!existing) {
      map.set(key, {
        name: base,
        processCount: 1,
        cpuPercent: p.cpuPercent ?? 0,
        memoryBytes: p.memoryBytes ?? 0,
      });
    } else {
      existing.processCount += 1;
      existing.cpuPercent += p.cpuPercent ?? 0;
      existing.memoryBytes += p.memoryBytes ?? 0;
    }
  }

  return [...map.values()]
    .sort((a, b) => b.memoryBytes - a.memoryBytes)
    .slice(0, 20)
    .map((a) => ({
      name: a.name,
      processCount: a.processCount,
      cpuPercent: Math.round(a.cpuPercent * 10) / 10,
      memoryBytes: a.memoryBytes,
      status:
        a.memoryBytes > 2 * 1024 * 1024 * 1024 || a.cpuPercent > 50
          ? ("HIGH_RESOURCE" as const)
          : ("ONLINE" as const),
      firstObservedAt: null,
      lastObservedAt: new Date().toISOString(),
    }));
}
