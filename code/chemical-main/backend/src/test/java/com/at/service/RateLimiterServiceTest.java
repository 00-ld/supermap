package com.at.service;

import org.junit.jupiter.api.Test;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class RateLimiterServiceTest {

    private final RateLimiterService rateLimiterService = new RateLimiterService();

    @Test
    void blocksOnlyAfterLimitIsExceeded() {
        Duration window = Duration.ofMinutes(1);

        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.10", 2, window)).isFalse();
        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.10", 2, window)).isFalse();
        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.10", 2, window)).isTrue();
    }

    @Test
    void isolatesDifferentScopesAndKeys() {
        Duration window = Duration.ofMinutes(1);

        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.10", 1, window)).isFalse();
        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.10", 1, window)).isTrue();

        assertThat(rateLimiterService.isRateLimited("register", "192.0.2.10", 1, window)).isFalse();
        assertThat(rateLimiterService.isRateLimited("login", "192.0.2.11", 1, window)).isFalse();
    }

    @Test
    void rejectsInvalidLimits() {
        assertThatThrownBy(() -> rateLimiterService.isRateLimited("login", "192.0.2.10", 0, Duration.ofMinutes(1)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("limit must be positive");
    }
}
