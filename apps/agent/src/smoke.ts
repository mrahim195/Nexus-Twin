import { collectMetricSnapshot, collectProcessSnapshot } from "./collectors/index.js";

async function main() {
  const metrics = await collectMetricSnapshot("local-dev");
  const procs = await collectProcessSnapshot("local-dev");
  console.log(
    JSON.stringify(
      {
        cpu: metrics.snapshot.cpu.utilizationPercent,
        ram: metrics.snapshot.memory.usedPercent,
        disks: metrics.snapshot.disks.length,
        gpu: metrics.snapshot.gpu?.name ?? "UNAVAILABLE",
        topProcess: procs.snapshot.processes[0]?.name ?? null,
        collectors: metrics.collectors.map((c) => `${c.name}:${c.health}`),
      },
      null,
      2
    )
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
