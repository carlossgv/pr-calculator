type Attempt = { failures: number[]; blockedUntil?: number };

export class LoginAttemptLimiter {
  private readonly attempts = new Map<string, Attempt>();

  constructor(
    private readonly maxFailures = 5,
    private readonly windowMs = 15 * 60 * 1000,
    private readonly blockMs = 15 * 60 * 1000,
  ) {}

  private key(recoveryId: string, sourceIp: string) {
    return `${recoveryId}\u0000${sourceIp}`;
  }

  isBlocked(recoveryId: string, sourceIp: string, now = Date.now()): boolean {
    this.cleanup(now);
    return (this.attempts.get(this.key(recoveryId, sourceIp))?.blockedUntil ?? 0) > now;
  }

  recordFailure(recoveryId: string, sourceIp: string, now = Date.now()) {
    const key = this.key(recoveryId, sourceIp);
    const current = this.attempts.get(key) ?? { failures: [] };
    current.failures = current.failures.filter((time) => time > now - this.windowMs);
    current.failures.push(now);
    if (current.failures.length >= this.maxFailures) current.blockedUntil = now + this.blockMs;
    this.attempts.set(key, current);
  }

  reset(recoveryId: string, sourceIp: string) {
    this.attempts.delete(this.key(recoveryId, sourceIp));
  }

  cleanup(now = Date.now()) {
    for (const [key, attempt] of this.attempts) {
      const recent = attempt.failures.some((time) => time > now - this.windowMs);
      if (!recent && (attempt.blockedUntil ?? 0) <= now) this.attempts.delete(key);
    }
  }
}
