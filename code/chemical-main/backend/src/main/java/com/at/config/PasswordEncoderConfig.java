package com.at.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.argon2.Argon2PasswordEncoder;
import org.springframework.security.crypto.password.DelegatingPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.HashMap;
import java.util.Map;

/**
 * Central password-hash configuration.
 *
 * <p>All newly stored passwords are written with the {argon2id} prefix. This
 * project has no production account migration requirement, so legacy hash
 * compatibility is intentionally not enabled.
 */
@Configuration
public class PasswordEncoderConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        PasswordEncoder argon2id = Argon2PasswordEncoder.defaultsForSpringSecurity_v5_8();
        Map<String, PasswordEncoder> encoders = new HashMap<>();
        encoders.put("argon2id", argon2id);

        return new DelegatingPasswordEncoder("argon2id", encoders);
    }
}
