package com.at.utils;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import java.nio.charset.StandardCharsets;
import java.security.Key;
import java.util.Date;
import java.util.Map;

public class JwtUtils {

    private static final long EXPIRE = 1000L * 60 * 60 * 24;

    private JwtUtils() {
    }

    private static final class SigningKeyHolder {
        private static final Key SIGNING_KEY = createSigningKey(System.getenv("JWT_SECRET"));
    }

    static Key createSigningKey(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException("JWT_SECRET must be configured before starting the backend.");
        }
        if (secret.length() < 32) {
            throw new IllegalStateException("JWT_SECRET must contain at least 32 characters.");
        }
        return Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public static String generateJwt(Map<String, Object> claims) {
        return Jwts.builder()
                .addClaims(claims)
                .setExpiration(new Date(System.currentTimeMillis() + EXPIRE))
                .signWith(SigningKeyHolder.SIGNING_KEY)
                .compact();
    }

    public static Claims parseJWT(String jwt) {
        return Jwts.parserBuilder()
                .setSigningKey(SigningKeyHolder.SIGNING_KEY)
                .build()
                .parseClaimsJws(jwt)
                .getBody();
    }
}
