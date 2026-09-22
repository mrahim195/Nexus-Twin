"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { DeviceShell } from "@/components/DeviceShell";

export function useDeviceId() {
  const params = useParams<{ id: string }>();
  return params.id;
}

export function useLive(deviceId: string, ms = 5000) {
  const [live, setLive] = useState<Record<string, unknown> | null>(null);
  const [meta, setMeta] = useState<{ name: string; status: string } | null>(null);

  const load = useCallback(async () => {
    const [d, l] = await Promise.all([
      fetch(`/api/devices/${deviceId}`),
      fetch(`/api/devices/${deviceId}/live`),
    ]);
    if (d.status === 401 || l.status === 401) {
      window.location.href = "/login";
      return;
    }
    if (d.ok) {
      const j = await d.json();
      setMeta({ name: j.device.name, status: j.device.status });
    }
    if (l.ok) setLive(await l.json());
  }, [deviceId]);

  useEffect(() => {
    void load();
    const t = setInterval(() => void load(), ms);
    return () => clearInterval(t);
  }, [load, ms]);

  return { live, meta, reload: load };
}

export function DevicePageFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const id = useDeviceId();
  const { meta } = useLive(id, 15000);
  return (
    <DeviceShell deviceId={id} deviceName={meta?.name}>
      <h1 className="mono" style={{ marginTop: 0, fontSize: "1.35rem" }}>
        {title}
      </h1>
      {children}
    </DeviceShell>
  );
}
