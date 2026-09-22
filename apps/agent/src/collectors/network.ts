import si from "systeminformation";
import type {
  CollectorStatus,
  NetworkInterfaceMetrics,
  NetworkMetrics,
} from "@nexus-twin/types";
import { collectorError, collectorOk } from "../logger.js";

let previous: { at: number; rx: number; tx: number } | null = null;

export async function collectNetwork(): Promise<{
  metrics: NetworkMetrics;
  status: CollectorStatus;
}> {
  try {
    const [ifaces, stats, inet] = await Promise.all([
      si.networkInterfaces(),
      si.networkStats(),
      si.inetChecksite("https://example.com").catch(() => ({ ok: false })),
    ]);

    const list = Array.isArray(ifaces) ? ifaces : [ifaces];
    const now = Date.now();
    let uploadBytesPerSec: number | null = null;
    let downloadBytesPerSec: number | null = null;

    const totalRx = stats.reduce((s, n) => s + (n.rx_bytes || 0), 0);
    const totalTx = stats.reduce((s, n) => s + (n.tx_bytes || 0), 0);

    if (previous) {
      const dt = (now - previous.at) / 1000;
      if (dt > 0) {
        downloadBytesPerSec = Math.max(0, (totalRx - previous.rx) / dt);
        uploadBytesPerSec = Math.max(0, (totalTx - previous.tx) / dt);
      }
    }
    previous = { at: now, rx: totalRx, tx: totalTx };

    const interfaces: NetworkInterfaceMetrics[] = list
      .filter((i) => i && i.iface)
      .map((i) => {
        const st = stats.find((s) => s.iface === i.iface);
        return {
          name: i.iface,
          connected: i.operstate === "up",
          ipv4: i.ip4 ? [i.ip4] : [],
          bytesSent: st?.tx_bytes ?? null,
          bytesReceived: st?.rx_bytes ?? null,
          uploadBytesPerSec,
          downloadBytesPerSec,
          latencyMs: null,
        };
      });

    return {
      metrics: {
        internetConnected: Boolean(inet && "ok" in inet ? inet.ok : false),
        interfaces,
      },
      status: collectorOk("network"),
    };
  } catch (err) {
    return {
      metrics: { internetConnected: null, interfaces: [] },
      status: collectorError(
        "network",
        err instanceof Error ? err.message : "Network collector failed"
      ),
    };
  }
}
