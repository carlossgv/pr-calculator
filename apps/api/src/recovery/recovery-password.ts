import { randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(nodeScrypt);
const KEY_LENGTH = 64;
export const RECOVERY_PASSWORD_VERSION = 1;

export function isValidRecoveryPassword(password: string): boolean {
  return password.length >= 8 && password.length <= 128;
}

export async function deriveRecoveryPassword(password: string) {
  const salt = randomBytes(16).toString("base64url");
  const derived = (await scrypt(password, salt, KEY_LENGTH)) as Buffer;
  return { salt, derived: derived.toString("base64url"), version: RECOVERY_PASSWORD_VERSION };
}

export async function verifyRecoveryPassword(
  password: string,
  stored: { salt: string; derived: string; version: number },
): Promise<boolean> {
  if (stored.version !== RECOVERY_PASSWORD_VERSION) return false;
  const expected = Buffer.from(stored.derived, "base64url");
  const actual = (await scrypt(password, stored.salt, expected.length)) as Buffer;
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
