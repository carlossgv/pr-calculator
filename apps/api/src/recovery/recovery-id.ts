const RECOVERY_ID_PATTERN = /^[a-z0-9](?:[a-z0-9_-]{1,28}[a-z0-9])$/;
const RESERVED_RECOVERY_IDS = new Set(["admin", "support", "system", "root"]);

export function normalizeRecoveryId(value: string): string {
  return value.toLowerCase();
}

export function isValidRecoveryId(value: string): boolean {
  const normalized = normalizeRecoveryId(value);
  return RECOVERY_ID_PATTERN.test(normalized) && !RESERVED_RECOVERY_IDS.has(normalized);
}
