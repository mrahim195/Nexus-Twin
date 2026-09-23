import { INTERVALS } from "@nexus-twin/config";

export type Job = () => Promise<void> | void;

export class Scheduler {
  private timers: NodeJS.Timeout[] = [];
  private running = false;
  private busy = new Set<string>();

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
    this.busy.clear();
  }

  every(seconds: number, job: Job, name = `job-${this.timers.length}`): void {
    const ms = Math.max(1, seconds) * 1000;
    const tick = async () => {
      if (!this.running) return;
      if (this.busy.has(name)) return; // never overlap slow Mongo/API calls
      this.busy.add(name);
      try {
        await job();
      } catch (err) {
        console.error("[ERROR] Scheduler job failed", name, err);
      } finally {
        this.busy.delete(name);
      }
    };
    void tick();
    this.timers.push(setInterval(() => void tick(), ms));
  }
}

export function resolveIntervals(env: NodeJS.ProcessEnv = process.env) {
  return {
    heartbeatSec: Number(env.NEXUS_HEARTBEAT_INTERVAL_SEC) || INTERVALS.heartbeatSec,
    // Cloud mode defaults slightly slower to keep dashboard responsive
    cpuRamSec: Number(env.NEXUS_INTERVAL_CPU_RAM_SEC) || Math.max(INTERVALS.cpuRamSec, 10),
    networkSec: Number(env.NEXUS_INTERVAL_NETWORK_SEC) || INTERVALS.networkSec,
    diskSec: Number(env.NEXUS_INTERVAL_DISK_SEC) || INTERVALS.diskSec,
    processSec: Number(env.NEXUS_INTERVAL_PROCESS_SEC) || Math.max(INTERVALS.processSec, 30),
    gpuSec: Number(env.NEXUS_INTERVAL_GPU_SEC) || INTERVALS.gpuSec,
    agentStatusSec: Number(env.NEXUS_INTERVAL_AGENT_STATUS_SEC) || 60,
  };
}
