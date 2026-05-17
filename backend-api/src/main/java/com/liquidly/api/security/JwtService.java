package com.liquidly.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.time.Instant;
import java.util.Date;


@Service
public class JwtService {

    public static final long TOKEN_DURATION_MS = 3600000L;
    private static final String SESSION_ID_CLAIM = "sessionId";

    // Secret key used to sign and validate JWT tokens.
    private final SecretKey SECRET_KEY =
            Keys.hmacShaKeyFor("liquidly-secret-key-liquidly-secret-key".getBytes());

    // Generate a signed JWT token for the given email subject.
    public String generateToken(String email, String sessionId) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + TOKEN_DURATION_MS))
                .claim(SESSION_ID_CLAIM, sessionId)
                .signWith(SECRET_KEY)
                .compact();
    }

    // Return the signing key (used by filters and validators).
    public SecretKey getSecretKey() {
        return SECRET_KEY;
    }

    // Extract the email (subject) from a valid token.
    public String extractEmail(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .getSubject();
    }

    public String extractSessionId(String token) {
        Object value = Jwts.parserBuilder()
                .setSigningKey(SECRET_KEY)
                .build()
                .parseClaimsJws(token)
                .getBody()
                .get(SESSION_ID_CLAIM);
        return value == null ? "" : String.valueOf(value);
    }

    public Instant calculateExpirationInstant() {
        return Instant.ofEpochMilli(System.currentTimeMillis() + TOKEN_DURATION_MS);
    }

    // Validate token signature and expiration.
    public boolean isTokenValid(String token) {
        try {
            Jwts.parserBuilder()
                    .setSigningKey(SECRET_KEY)
                    .build()
                    .parseClaimsJws(token);

            return true;

        } catch (Exception e) {
            return false;
        }
    }

}
