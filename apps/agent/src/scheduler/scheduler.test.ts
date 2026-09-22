import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveIntervals } from "./scheduler.js";

test("resolveIntervals uses defaults", () => {
  const i = resolveIntervals({});
  assert.equal(i.heartbeatSec, 20);
  assert.ok(i.cpuRamSec > 0);
});

test("resolveIntervals respects env overrides", () => {
  const i = resolveIntervals({ NEXUS_HEARTBEAT_INTERVAL_SEC: "15" });
  assert.equal(i.heartbeatSec, 15);
});
