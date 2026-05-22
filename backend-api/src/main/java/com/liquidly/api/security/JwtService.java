package com.liquidly.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;


@Service
public class JwtService {

    private static final Logger logger = LoggerFactory.getLogger(JwtService.class);
    private static final String SESSION_ID_CLAIM = "sessionId";
    private static final int MIN_SECRET_LENGTH = 32;

    private final SecretKey secretKey;
    private final long tokenDurationMs;
    private final String issuer;

    public JwtService(
            @Value("${app.security.jwt.secret}") String rawSecret,
            @Value("${app.environment:development}") String appEnvironment,
            @Value("${app.security.jwt.expiration-ms:3600000}") long tokenDurationMs,
            @Value("${app.security.jwt.issuer:liquidly-backend}") String issuer
    ) {
        String normalizedSecret = rawSecret == null ? "" : rawSecret.trim();
        String normalizedEnvironment = appEnvironment == null ? "development" : appEnvironment.trim().toLowerCase();
        if (normalizedSecret.isEmpty()) {
            if (!isDevelopmentEnvironment(normalizedEnvironment)) {
                throw new IllegalStateException("APP_SECURITY_JWT_SECRET is required outside development");
            }
            normalizedSecret = generateDevelopmentSecret();
            logger.warn("APP_SECURITY_JWT_SECRET is not set; using a generated development secret for this process only");
        }
        if (normalizedSecret.length() < MIN_SECRET_LENGTH) {
            throw new IllegalStateException("JWT secret must have at least 32 characters");
        }
        this.secretKey = Keys.hmacShaKeyFor(normalizedSecret.getBytes(StandardCharsets.UTF_8));
        this.tokenDurationMs = tokenDurationMs;
        this.issuer = issuer == null || issuer.isBlank() ? "liquidly-backend" : issuer.trim();
    }

    private boolean isDevelopmentEnvironment(String environment) {
        return "development".equals(environment) || "dev".equals(environment) || "local".equals(environment) || "test".equals(environment);
    }

    private String generateDevelopmentSecret() {
        return java.util.UUID.randomUUID().toString().replace("-", "")
                + java.util.UUID.randomUUID().toString().replace("-", "");
    }

    // Generate a signed JWT token for the given email subject.
    public String generateToken(String email, String sessionId) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuer(issuer)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + tokenDurationMs))
                .claim(SESSION_ID_CLAIM, sessionId)
                .signWith(secretKey)
                .compact();
    }

    // Return the signing key (used by filters and validators).
    public SecretKey getSecretKey() {
        return secretKey;
    }

    // Extract the email (subject) from a valid token.
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractSessionId(String token) {
        Object value = Jwts.parserBuilder()
                .setSigningKey(secretKey)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get(SESSION_ID_CLAIM);
        return value == null ? "" : String.valueOf(value);
    }

    public Instant calculateExpirationInstant() {
        return Instant.ofEpochMilli(System.currentTimeMillis() + tokenDurationMs);
    }

    // Validate token signature and expiration.
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(secretKey)
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {
            return false;
        }
    }

}
