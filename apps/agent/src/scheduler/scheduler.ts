import { INTERVALS } from "@nexus-twin/config";

export type Job = () => Promise<void> | void;

export class Scheduler {
  private timers: NodeJS.Timeout[] = [];
  private running = false;

  start(): void {
    this.running = true;
  }

  stop(): void {
    this.running = false;
    for (const t of this.timers) clearInterval(t);
    this.timers = [];
  }

  every(seconds: number, job: Job): void {
    const ms = Math.max(1, seconds) * 1000;
    const tick = async () => {
      if (!this.running) return;
      try {
        await job();
      } catch (err) {
        console.error("[ERROR] Scheduler job failed", err);
      }
    };
    void tick();
    this.timers.push(setInterval(() => void tick(), ms));
  }
}

export function resolveIntervals(env: NodeJS.ProcessEnv = process.env) {
  return {
    heartbeatSec: Number(env.NEXUS_HEARTBEAT_INTERVAL_SEC) || INTERVALS.heartbeatSec,
    cpuRamSec: Number(env.NEXUS_INTERVAL_CPU_RAM_SEC) || INTERVALS.cpuRamSec,
    networkSec: Number(env.NEXUS_INTERVAL_NETWORK_SEC) || INTERVALS.networkSec,
    diskSec: Number(env.NEXUS_INTERVAL_DISK_SEC) || INTERVALS.diskSec,
    processSec: Number(env.NEXUS_INTERVAL_PROCESS_SEC) || INTERVALS.processSec,
    gpuSec: Number(env.NEXUS_INTERVAL_GPU_SEC) || INTERVALS.gpuSec,
  };
}
