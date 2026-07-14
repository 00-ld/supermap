package com.at.utils;

import org.junit.jupiter.api.Test;

import java.security.Key;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class JwtUtilsTest {

    @Test
    void signingKeyRequiresConfiguredSecret() {
        assertThatThrownBy(() -> JwtUtils.createSigningKey(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET must be configured");
        assertThatThrownBy(() -> JwtUtils.createSigningKey(""))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("JWT_SECRET must be configured");
    }

    @Test
    void signingKeyRejectsShortSecret() {
        assertThatThrownBy(() -> JwtUtils.createSigningKey("too-short"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("at least 32 characters");
    }

    @Test
    void signingKeyAcceptsThirtyTwoCharacterSecret() {
        Key key = JwtUtils.createSigningKey("0123456789abcdef0123456789abcdef");

        assertThat(key).isNotNull();
    }
}
