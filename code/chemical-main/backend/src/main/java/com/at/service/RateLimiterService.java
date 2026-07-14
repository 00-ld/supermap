package com.at.service;

import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.Objects;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

/**
 * Lightweight in-process fixed-window rate limiter for single-node deployments.
 *
 * <p>The state is intentionally centralized outside controllers so cleanup,
 * bucket naming, and future Redis/Bucket4j replacement all have one owner.
 */
@Service
public class RateLimiterService {

    private static final int CLEANUP_THRESHOLD = 10_000;
    private static final long CLEANUP_INTERVAL_MILLIS = 60_000L;

    private final ConcurrentHashMap<String, AttemptWindow> attempts = new ConcurrentHashMap<>();
    private final AtomicLong lastCleanupMillis = new AtomicLong();

    public boolean isRateLimited(String scope, String key, int limit, Duration window) {
        Objects.requireNonNull(scope, "scope must not be null");
        Objects.requireNonNull(key, "key must not be null");
        Objects.requireNonNull(window, "window must not be null");
        if (limit <= 0) {
            throw new IllegalArgumentException("limit must be positive");
        }

        long now = System.currentTimeMillis();
        cleanupExpired(now);

        long windowMillis = window.toMillis();
        String bucketKey = scope + ":" + key;
        AttemptWindow current = attempts.compute(bucketKey, (ignored, existing) -> {
            if (existing == null || existing.isExpired(now)) {
                return new AttemptWindow(1, now, windowMillis);
            }
            return existing.incremented();
        });
        return current.count() > limit;
    }

    private void cleanupExpired(long now) {
        long lastCleanup = lastCleanupMillis.get();
        boolean shouldCleanup = attempts.size() > CLEANUP_THRESHOLD
                || now - lastCleanup > CLEANUP_INTERVAL_MILLIS;
        if (!shouldCleanup || !lastCleanupMillis.compareAndSet(lastCleanup, now)) {
            return;
        }
        attempts.entrySet().removeIf(entry -> entry.getValue().isExpired(now));
    }

    private record AttemptWindow(int count, long windowStartMillis, long windowMillis) {

        private AttemptWindow incremented() {
            return new AttemptWindow(count + 1, windowStartMillis, windowMillis);
        }

        private boolean isExpired(long now) {
            return now - windowStartMillis > windowMillis;
        }
    }
}
