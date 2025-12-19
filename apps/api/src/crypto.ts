/* FILE: apps/api/src/crypto.ts */
import { createHash } from "node:crypto";

export function sha256Base64Url(input: string) {
  const h = createHash("sha256").update(input, "utf8").digest("base64");
  return h.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
