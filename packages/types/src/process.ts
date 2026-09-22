/** Process and application observation types */

export interface ProcessInfo {
  name: string;
  pid: number;
  cpuPercent: number | null;
  memoryBytes: number | null;
  threadCount: number | null;
  parentPid: number | null;
  startedAt: string | null;
  executablePath: string | null;
}

export interface ProcessSnapshot {
  deviceId: string;
  collectedAt: string;
  processes: ProcessInfo[];
}

export interface ApplicationAggregate {
  name: string;
  processCount: number;
  cpuPercent: number | null;
  memoryBytes: number | null;
  status: "ONLINE" | "HIGH_RESOURCE" | "OFFLINE";
  firstObservedAt: string | null;
  lastObservedAt: string | null;
}
