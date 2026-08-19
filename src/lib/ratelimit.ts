type Bucket = { window: number; points: Map<string, number[]> };

const buckets = new Map<string, Bucket>();

function emptyBucket(windowMs: number): Bucket {
  return { window: windowMs, points: new Map() };
}

function sweep(bucket: Bucket, now: number) {
  for (const [key, times] of bucket.points) {
    const kept = times.filter((t) => now - t < bucket.window);
    if (kept.length === 0) bucket.points.delete(key);
    else bucket.points.set(key, kept);
  }
}

/**
 * Simple in-memory sliding window rate limiter. Suitable for single-instance
 * deployments (the default for Vercel serverless funnels are per-instance, so
 * treat this as a soft limit, not a security boundary).
 */
export function rateLimit(opts: {
  key: string;
  limit: number;
  windowMs: number;
}): { allowed: boolean; retryAfterMs?: number } {
  const now = Date.now();
  let bucket = buckets.get(opts.key);
  if (!bucket) {
    bucket = emptyBucket(opts.windowMs);
    buckets.set(opts.key, bucket);
  }
  sweep(bucket, now);

  const times = bucket.points.get(opts.key) ?? [];
  if (times.length >= opts.limit) {
    const oldest = times[0] ?? now;
    return { allowed: false, retryAfterMs: oldest + opts.windowMs - now };
  }
  times.push(now);
  bucket.points.set(opts.key, times);
  return { allowed: true };
}