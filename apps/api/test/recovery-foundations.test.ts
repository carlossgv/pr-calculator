import { describe, expect, it } from "vitest";
import { isValidRecoveryId, normalizeRecoveryId } from "../src/recovery/recovery-id";
import { LoginAttemptLimiter } from "../src/recovery/login-attempt-limiter";
import { deriveRecoveryPassword, isValidRecoveryPassword, verifyRecoveryPassword } from "../src/recovery/recovery-password";

describe("Recovery IDs", () => {
  it("normalizes case and accepts the documented format", () => {
    expect(normalizeRecoveryId("Carlos-7")).toBe("carlos-7");
    expect(isValidRecoveryId("Carlos-7")).toBe(true);
  });

  it.each(["ab", "-abc", "abc_", "ábc", "a b", "admin", "support", "system", "root"])(
    "rejects %s",
    (value) => expect(isValidRecoveryId(value)).toBe(false),
  );
});

describe("Recovery passwords", () => {
  it("derives unique salts and verifies in constant-time comparison path", async () => {
    const first = await deriveRecoveryPassword("password1");
    const second = await deriveRecoveryPassword("password1");
    expect(first.salt).not.toBe(second.salt);
    await expect(verifyRecoveryPassword("password1", first)).resolves.toBe(true);
    await expect(verifyRecoveryPassword("password2", first)).resolves.toBe(false);
  });

  it("validates length without trimming", () => {
    expect(isValidRecoveryPassword("12345678")).toBe(true);
    expect(isValidRecoveryPassword("1234567")).toBe(false);
    expect(isValidRecoveryPassword(" ".repeat(8))).toBe(true);
    expect(isValidRecoveryPassword("x".repeat(129))).toBe(false);
  });
});

describe("LoginAttemptLimiter", () => {
  it("blocks after five failures and resets on success", () => {
    const limiter = new LoginAttemptLimiter();
    for (let i = 0; i < 5; i++) limiter.recordFailure("person", "127.0.0.1", i);
    expect(limiter.isBlocked("person", "127.0.0.1", 5)).toBe(true);
    expect(limiter.isBlocked("person", "127.0.0.2", 5)).toBe(false);
    limiter.reset("person", "127.0.0.1");
    expect(limiter.isBlocked("person", "127.0.0.1", 5)).toBe(false);
  });

  it("cleans stale entries", () => {
    const limiter = new LoginAttemptLimiter(5, 100, 100);
    limiter.recordFailure("person", "ip", 0);
    limiter.cleanup(101);
    expect(limiter.isBlocked("person", "ip", 101)).toBe(false);
  });
});
