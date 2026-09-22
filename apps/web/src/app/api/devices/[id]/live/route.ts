import { NextResponse } from "next/server";
import {
  AgentStatusModel,
  MetricSnapshotModel,
  ProcessSnapshotModel,
} from "@nexus-twin/database";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import { deriveDeviceStatus } from "@/lib/device-utils";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const auth = await requireUserSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await ctx.params;
  await db();
  const device = await requireOwnedDevice(id, auth.userId);
  if (!device) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const [metric, processes, agent] = await Promise.all([
    MetricSnapshotModel.findOne({ deviceId: device._id })
      .sort({ collectedAt: -1 })
      .lean(),
    ProcessSnapshotModel.findOne({ deviceId: device._id })
      .sort({ collectedAt: -1 })
      .lean(),
    AgentStatusModel.findOne({ deviceId: device._id }).lean(),
  ]);

  const status = deriveDeviceStatus(device.lastHeartbeatAt, device.status);

  return NextResponse.json({
    status,
    collectedAt: metric?.collectedAt ?? null,
    metrics: metric
      ? {
          cpu: metric.cpu,
          memory: metric.memory,
          disks: metric.disks,
          gpu: metric.gpu,
          network: metric.network,
        }
      : null,
    processes: processes?.processes ?? [],
    agent: agent
      ? {
          agentVersion: agent.agentVersion,
          connected: agent.connected && status === "ONLINE",
          lastHeartbeatAt: agent.lastHeartbeatAt,
          telemetryActive: agent.telemetryActive,
          queueSize: agent.queueSize,
          collectors: agent.collectors,
          lastSyncAt: agent.lastSyncAt,
        }
      : null,
  });
}
