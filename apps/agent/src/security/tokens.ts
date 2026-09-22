import { createHash, randomBytes } from "node:crypto";

/** Hash helper for local verification — server stores its own token hashes */
export function sha256(input: string): string {
  return createHash("sha256").update(input).digest("hex");
}

export function generateLocalNonce(): string {
  return randomBytes(16).toString("hex");
}

export function redactToken(token: string): string {
  if (token.length < 8) return "***";
  return `${token.slice(0, 4)}…${token.slice(-4)}`;
}
