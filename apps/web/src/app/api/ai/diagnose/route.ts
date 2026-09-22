import { NextResponse } from "next/server";
import {
  AiDiagnosticModel,
  AnomalyModel,
  EventModel,
  MetricSnapshotModel,
  ProcessSnapshotModel,
} from "@nexus-twin/database";
import { aiDiagnoseRequestSchema } from "@nexus-twin/validation";
import { requireOwnedDevice, requireUserSession } from "@/lib/guards";
import { db } from "@/lib/mongo";
import {
  buildEvidencePackage,
  buildHourlyBaselines,
  type MetricPoint,
} from "@/lib/analysis";
import { diagnoseWithGemini } from "@/lib/gemini";

export async function POST(req: Request) {
  const auth = await requireUserSession();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = aiDiagnoseRequestSchema.parse(await req.json());
    await db();
    const device = await requireOwnedDevice(body.deviceId, auth.userId);
    if (!device) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const end = body.windowEnd ? new Date(body.windowEnd) : new Date();
    const start = body.windowStart
      ? new Date(body.windowStart)
      : new Date(end.getTime() - 6 * 3600_000);

    const [metrics, processSnap, events, baselineRows] = await Promise.all([
      MetricSnapshotModel.find({
        deviceId: device._id,
        collectedAt: { $gte: start, $lte: end },
      })
        .sort({ collectedAt: 1 })
        .limit(2000)
        .lean(),
      ProcessSnapshotModel.findOne({ deviceId: device._id })
        .sort({ collectedAt: -1 })
        .lean(),
      EventModel.find({
        deviceId: device._id,
        occurredAt: { $gte: start, $lte: end },
      })
        .sort({ occurredAt: -1 })
        .limit(40)
        .lean(),
      MetricSnapshotModel.find({
        deviceId: device._id,
        collectedAt: { $gte: new Date(end.getTime() - 7 * 24 * 3600_000) },
      })
        .select({ collectedAt: 1, cpu: 1, memory: 1, gpu: 1 })
        .limit(5000)
        .lean(),
    ]);

    const series: MetricPoint[] = metrics.map((m) => ({
      t: m.collectedAt,
      cpu: (m.cpu as { utilizationPercent?: number | null })?.utilizationPercent ?? null,
      ram: (m.memory as { usedPercent?: number | null })?.usedPercent ?? null,
      gpu:
        (m.gpu as { utilizationPercent?: number | null } | null)?.utilizationPercent ??
        null,
    }));

    const baselineSeries: MetricPoint[] = baselineRows.map((m) => ({
      t: m.collectedAt,
      cpu: (m.cpu as { utilizationPercent?: number | null })?.utilizationPercent ?? null,
      ram: (m.memory as { usedPercent?: number | null })?.usedPercent ?? null,
      gpu: null,
    }));

    const last = metrics[metrics.length - 1];
    const disks =
      (last?.disks as Array<{
        mount: string;
        usedPercent: number | null;
        freeBytes: number | null;
      }>) || [];

    const evidence = buildEvidencePackage({
      deviceId: String(device._id),
      question: body.question,
      windowStart: start.toISOString(),
      windowEnd: end.toISOString(),
      series,
      disks,
      network: (last?.network as Record<string, unknown>) || {},
      topProcesses: ((processSnap?.processes as Array<{
        name: string;
        cpuPercent: number | null;
        memoryBytes: number | null;
      }>) || []).slice(0, 20),
      recentEvents: events.map((e) => ({
        type: e.type,
        title: e.title,
        message: e.message,
        occurredAt: e.occurredAt,
        severity: e.severity,
      })),
      baselines: buildHourlyBaselines(baselineSeries),
    });

    const diagnosis = await diagnoseWithGemini(evidence);

    const saved = await AiDiagnosticModel.create({
      deviceId: device._id,
      ownerId: auth.userId,
      question: body.question,
      summary: diagnosis.summary,
      observations: diagnosis.observations,
      likelyCauses: diagnosis.likelyCauses,
      evidence: diagnosis.evidence,
      recommendations: diagnosis.recommendations,
      confidence: diagnosis.confidence,
      limitations: diagnosis.limitations,
      evidencePackage: evidence,
    });

    // Persist anomalies from evidence peaks opportunistically
    const ramPeak = (evidence.memorySummary as { peak?: number | null }).peak;
    if (ramPeak != null && ramPeak >= 90) {
      await AnomalyModel.create({
        deviceId: device._id,
        metric: "memory",
        observedValue: ramPeak,
        expectedValue: null,
        severity: "high",
        relatedProcess: evidence.topProcesses[0]
          ? String((evidence.topProcesses[0] as { name?: string }).name)
          : null,
        relatedApplication: null,
        explanation: `AI session noted RAM peak ${ramPeak}% in evidence window.`,
        detectedAt: new Date(),
      });
    }

    return NextResponse.json({
      id: String(saved._id),
      ...diagnosis,
      evidencePackage: evidence,
      provider: process.env.GEMINI_API_KEY ? "gemini" : "deterministic",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Diagnosis failed" }, { status: 400 });
  }
}
