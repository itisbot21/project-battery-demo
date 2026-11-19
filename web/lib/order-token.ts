import { createHash } from "node:crypto";

export const trackingTokenPattern = /^[a-f0-9]{64}$/;
export function digest(value: string) {
  return createHash("sha256").update(value).digest("hex");
}
