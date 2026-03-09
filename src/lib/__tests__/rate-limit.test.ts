import { rateLimit } from '@/lib/rate-limit';

describe('rateLimit', () => {
  // Use unique keys per test to avoid cross-test contamination
  let testCounter = 0;
  const uniqueKey = () => `test-key-${testCounter++}-${Date.now()}`;

  it('allows first request', () => {
    const key = uniqueKey();
    const result = rateLimit(key, 5, 60000);
    expect(result.limited).toBe(false);
    expect(result.remaining).toBe(4);
  });

  it('tracks remaining attempts correctly', () => {
    const key = uniqueKey();
    rateLimit(key, 3, 60000); // 1st
    const second = rateLimit(key, 3, 60000); // 2nd
    expect(second.remaining).toBe(1);

    const third = rateLimit(key, 3, 60000); // 3rd — at limit
    expect(third.remaining).toBe(0);
    expect(third.limited).toBe(false);
  });

  it('blocks after exceeding max attempts', () => {
    const key = uniqueKey();
    rateLimit(key, 2, 60000); // 1st
    rateLimit(key, 2, 60000); // 2nd — at limit

    const blocked = rateLimit(key, 2, 60000); // 3rd — over limit
    expect(blocked.limited).toBe(true);
    expect(blocked.remaining).toBe(0);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });

  it('uses separate counters for different keys', () => {
    const key1 = uniqueKey();
    const key2 = uniqueKey();

    // Exhaust key1
    rateLimit(key1, 1, 60000);
    const blocked = rateLimit(key1, 1, 60000);
    expect(blocked.limited).toBe(true);

    // key2 should still be allowed
    const allowed = rateLimit(key2, 1, 60000);
    expect(allowed.limited).toBe(false);
  });

  it('resets after window expires', () => {
    const key = uniqueKey();

    // Use a very short window (1ms)
    rateLimit(key, 1, 1);

    // Wait for window to expire
    const start = Date.now();
    while (Date.now() - start < 5) {
      // busy wait
    }

    const result = rateLimit(key, 1, 1);
    expect(result.limited).toBe(false);
  });

  it('returns retryAfterMs within the window duration', () => {
    const key = uniqueKey();
    const windowMs = 60000;

    rateLimit(key, 1, windowMs);
    const blocked = rateLimit(key, 1, windowMs);

    expect(blocked.retryAfterMs).toBeLessThanOrEqual(windowMs);
    expect(blocked.retryAfterMs).toBeGreaterThan(0);
  });
});
