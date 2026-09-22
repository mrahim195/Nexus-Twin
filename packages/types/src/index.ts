export type * from "./device.js";
export type * from "./telemetry.js";
export type * from "./process.js";
export type * from "./events.js";
export type * from "./anomaly.js";
export type * from "./ai.js";
export type * from "./agent.js";

/** Sentinel string for UI when a metric cannot be collected */
export const UNAVAILABLE = "UNAVAILABLE" as const;
export type Unavailable = typeof UNAVAILABLE;
