"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useParams } from "next/navigation";
import { DeviceShell } from "@/components/DeviceShell";

type LiveData = Record<string, unknown> | null;
type Meta = {
  name: string;
  status: string;
  osVersion?: string;
  lastSeenLabel?: string;
  lastKnownReason?: string | null;
} | null;

type DeviceCtx = {
  deviceId: string;
  live: LiveData;
  meta: Meta;
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  fromCache: boolean;
  reload: () => Promise<void>;
};

const Ctx = createContext<DeviceCtx | null>(null);

const CACHE_TTL_MS = 30 * 60_000;

function cacheKey(deviceId: string, kind: string) {
  return `nexus:twin:${deviceId}:${kind}`;
}

export function readCache<T>(key: string, ttlMs = CACHE_TTL_MS): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { at: number; data: T };
    if (Date.now() - parsed.at > ttlMs) return null;
    return parsed.data;
  } catch {
    return null;
  }
}

export function writeCache(key: string, data: unknown) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(key, JSON.stringify({ at: Date.now(), data }));
  } catch {
    /* ignore quota */
  }
}

async function fetchWithTimeout(url: string, ms = 12000): Promise<Response> {
  const ac = new AbortController();
  const timer = setTimeout(() => ac.abort(), ms);
  try {
    return await fetch(url, {
      signal: ac.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } finally {
    clearTimeout(timer);
  }
}

function readDeviceCache(deviceId: string): { live: LiveData; meta: Meta } {
  if (!deviceId || typeof window === "undefined") {
    return { live: null, meta: null };
  }
  return {
    live: readCache<LiveData>(cacheKey(deviceId, "live")),
    meta: readCache<Meta>(cacheKey(deviceId, "meta")),
  };
}

/**
 * Instant paint from sessionStorage, then background refresh that updates cache.
 * Page shell should already be visible — this only hydrates page-specific data.
 */
export function useCachedJson<T>(
  cacheId: string,
  url: string | null,
  options?: {
    ttlMs?: number;
    intervalMs?: number | null;
    pick?: (json: unknown) => T;
    enabled?: boolean;
  }
): { data: T | null; loading: boolean; refreshing: boolean; error: string | null; reload: () => Promise<void> } {
  const ttlMs = options?.ttlMs ?? CACHE_TTL_MS;
  const intervalMs = options?.intervalMs ?? null;
  const enabled = options?.enabled !== false;
  const pickRef = useRef(options?.pick);
  pickRef.current = options?.pick;

  const storageKey = `nexus:twin:res:${cacheId}`;
  const [data, setData] = useState<T | null>(() => readCache<T>(storageKey, ttlMs));
  const [loading, setLoading] = useState(() => readCache<T>(storageKey, ttlMs) == null);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inFlight = useRef(false);
  const dataRef = useRef(data);
  dataRef.current = data;

  const reload = useCallback(async () => {
    if (!url || !enabled || inFlight.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    inFlight.current = true;
    const has = dataRef.current != null;
    if (has) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetchWithTimeout(url, 15000);
      if (res.status === 401) {
        window.location.href = "/login";
        return;
      }
      if (!res.ok) {
        if (!has) setError("Could not load data.");
        return;
      }
      const json = await res.json();
      const picker = pickRef.current;
      const next = (picker ? picker(json) : (json as T)) as T;
      setData(next);
      writeCache(storageKey, next);
      setError(null);
    } catch {
      if (!has) setError("Server busy. Showing cache if available.");
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, [url, enabled, storageKey]);

  useEffect(() => {
    const cached = readCache<T>(storageKey, ttlMs);
    if (cached != null) {
      setData(cached);
      setLoading(false);
    } else if (dataRef.current == null) {
      setLoading(true);
    }
    void reload();

    if (intervalMs == null || intervalMs <= 0) {
      return;
    }
    const t = setInterval(() => void reload(), intervalMs);
    const onVis = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [storageKey, url, ttlMs, intervalMs, reload]);

  return { data, loading, refreshing, error, reload };
}

export function DeviceProvider({ children }: { children: React.ReactNode }) {
  const params = useParams<{ id: string }>();
  const deviceId = params.id;

  const initial = useMemo(() => readDeviceCache(deviceId), [deviceId]);
  const [live, setLive] = useState<LiveData>(initial.live);
  const [meta, setMeta] = useState<Meta>(initial.meta);
  const [loading, setLoading] = useState(!initial.live && !initial.meta);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(Boolean(initial.live || initial.meta));
  const inFlight = useRef(false);
  const liveRef = useRef(live);
  const metaRef = useRef(meta);
  liveRef.current = live;
  metaRef.current = meta;

  // Keep state in sync when deviceId changes (client navigation between devices)
  useEffect(() => {
    const cached = readDeviceCache(deviceId);
    setLive(cached.live);
    setMeta(cached.meta);
    setFromCache(Boolean(cached.live || cached.meta));
    setLoading(!cached.live && !cached.meta);
    setError(null);
  }, [deviceId]);

  const reload = useCallback(async () => {
    if (!deviceId || inFlight.current) return;
    if (typeof document !== "undefined" && document.visibilityState === "hidden") return;

    inFlight.current = true;
    const hasData = liveRef.current !== null || metaRef.current !== null;
    if (hasData) setRefreshing(true);
    else setLoading(true);

    try {
      const [lRes, dRes] = await Promise.all([
        fetchWithTimeout(`/api/devices/${deviceId}/live`, 12000),
        fetchWithTimeout(`/api/devices/${deviceId}`, 12000),
      ]);

      if (lRes.status === 401 || dRes.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (dRes.ok) {
        const j = await dRes.json();
        const nextMeta = {
          name: j.device.name,
          status: j.device.status,
          osVersion: j.device.osVersion,
          lastSeenLabel: j.device.lastSeenLabel,
          lastKnownReason: j.device.lastKnownReason,
        };
        setMeta(nextMeta);
        writeCache(cacheKey(deviceId, "meta"), nextMeta);
      }

      if (lRes.ok) {
        const liveJson = await lRes.json();
        setLive(liveJson);
        writeCache(cacheKey(deviceId, "live"), liveJson);
        setFromCache(false);
        if (liveJson.status) {
          setMeta((m) => {
            const next = m
              ? { ...m, status: String(liveJson.status) }
              : { name: "Device", status: String(liveJson.status) };
            writeCache(cacheKey(deviceId, "meta"), next);
            return next;
          });
        }
        setError(null);
      } else if (!hasData) {
        setError("Could not refresh live data. Showing last known values if available.");
      }
    } catch {
      if (!hasData) {
        setError("Server busy or unreachable. Retrying…");
      } else {
        setError(null);
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      inFlight.current = false;
    }
  }, [deviceId]);

  useEffect(() => {
    void reload();
    const tick = () => {
      if (document.visibilityState === "hidden") return;
      void reload();
    };
    const t = setInterval(tick, 10000);
    const onVis = () => {
      if (document.visibilityState === "visible") void reload();
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [deviceId, reload]);

  const value = useMemo(
    () => ({
      deviceId,
      live,
      meta,
      loading,
      refreshing,
      error,
      fromCache,
      reload,
    }),
    [deviceId, live, meta, loading, refreshing, error, fromCache, reload]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useDevice() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDevice must be used within DeviceProvider");
  return ctx;
}

export function useDeviceId() {
  const params = useParams<{ id: string }>();
  return params.id;
}

export function useLive(_deviceId: string, _ms = 10000) {
  const d = useDevice();
  return { live: d.live, meta: d.meta, reload: d.reload, loading: d.loading };
}

/** Persistent chrome — stays mounted across device sub-routes. */
export function DeviceChrome({ children }: { children: React.ReactNode }) {
  const { deviceId, meta } = useDevice();
  return (
    <DeviceShell deviceId={deviceId} deviceName={meta?.name}>
      {children}
    </DeviceShell>
  );
}

export function DevicePageFrame({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const { refreshing, error, fromCache, reload } = useDevice();
  return (
    <>
      <div
        style={{
          display: "flex",
          alignItems: "baseline",
          gap: "0.75rem",
          flexWrap: "wrap",
          marginBottom: "0.75rem",
        }}
      >
        <h1 className="mono" style={{ margin: 0, fontSize: "1.35rem" }}>
          {title}
        </h1>
        {refreshing && (
          <span className="mono sync-pill" aria-live="polite">
            SYNC
          </span>
        )}
        {fromCache && !refreshing && (
          <span className="mono sync-pill" style={{ color: "var(--text-dim)" }}>
            CACHED
          </span>
        )}
      </div>
      {error && (
        <div
          className="panel"
          style={{
            padding: "0.75rem 1rem",
            marginBottom: "0.85rem",
            borderColor: "var(--warn)",
            display: "flex",
            justifyContent: "space-between",
            gap: "0.75rem",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          <span className="mono" style={{ color: "var(--warn)", fontSize: "0.8rem" }}>
            {error}
          </span>
          <button
            type="button"
            className="btn btn-ghost"
            style={{ minHeight: "auto", padding: "0.4rem 0.7rem" }}
            onClick={() => void reload()}
          >
            RETRY
          </button>
        </div>
      )}
      {children}
    </>
  );
}

export function PageSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <div className="card-list" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="skeleton"
          style={{ minHeight: i === 0 ? "5.5rem" : "3.25rem", marginBottom: "0.65rem" }}
        />
      ))}
    </div>
  );
}
