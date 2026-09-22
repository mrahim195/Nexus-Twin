/** Live and historical metric shapes. Missing OS support → null / UNAVAILABLE in UI */

export interface CpuMetrics {
  model: string | null;
  architecture: string | null;
  logicalCores: number | null;
  physicalCores: number | null;
  utilizationPercent: number | null;
  perCorePercent: number[] | null;
  frequencyMhz: number | null;
  loadAverage: number[] | null;
  temperatureC: number | null;
}

export interface MemoryMetrics {
  totalBytes: number | null;
  usedBytes: number | null;
  freeBytes: number | null;
  availableBytes: number | null;
  usedPercent: number | null;
  swapTotalBytes: number | null;
  swapUsedBytes: number | null;
}

export interface DiskPartition {
  mount: string;
  filesystem: string | null;
  totalBytes: number | null;
  usedBytes: number | null;
  freeBytes: number | null;
  usedPercent: number | null;
  readBytesPerSec: number | null;
  writeBytesPerSec: number | null;
  temperatureC: number | null;
  health: string | null;
}

export interface GpuMetrics {
  name: string | null;
  utilizationPercent: number | null;
  vramTotalBytes: number | null;
  vramUsedBytes: number | null;
  temperatureC: number | null;
  powerWatts: number | null;
}

export interface NetworkInterfaceMetrics {
  name: string;
  connected: boolean | null;
  ipv4: string[] | null;
  bytesSent: number | null;
  bytesReceived: number | null;
  uploadBytesPerSec: number | null;
  downloadBytesPerSec: number | null;
  latencyMs: number | null;
}

export interface NetworkMetrics {
  internetConnected: boolean | null;
  interfaces: NetworkInterfaceMetrics[];
}

export interface MetricSnapshot {
  deviceId: string;
  collectedAt: string;
  cpu: CpuMetrics;
  memory: MemoryMetrics;
  disks: DiskPartition[];
  gpu: GpuMetrics | null;
  network: NetworkMetrics;
}
