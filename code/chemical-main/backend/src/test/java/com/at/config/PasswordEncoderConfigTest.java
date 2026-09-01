package com.at.config;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.password.PasswordEncoder;

import static org.assertj.core.api.Assertions.assertThat;

class PasswordEncoderConfigTest {

    private final PasswordEncoder passwordEncoder = new PasswordEncoderConfig().passwordEncoder();

    @Test
    void encodesNewPasswordsWithArgon2idPrefix() {
        String encoded = passwordEncoder.encode("correct-horse-battery-staple");

        assertThat(encoded).startsWith("{argon2id}");
        assertThat(passwordEncoder.matches("correct-horse-battery-staple", encoded)).isTrue();
    }

    @Test
    void acceptsLegacyUnprefixedPasswordsForDemoDatabaseMigration() {
        assertThat(passwordEncoder.matches("legacy-password", "legacy-password")).isTrue();
        assertThat(passwordEncoder.matches("wrong-password", "legacy-password")).isFalse();
    }

    @Test
    void rejectsUnconfiguredPrefixedHashesWithoutThrowing() {
        assertThat(passwordEncoder.matches(
                "legacy-password",
                "{bcrypt}$2a$12$qHgmjMYUP3/MSPD91P8fqeQVrQfHfCcpC36wpiaP4tXrFMPcrIC82"
        )).isFalse();
    }
}
