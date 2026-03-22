package com.liquidly.api.security;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.util.Date;


@Service
public class JwtService {

    // Secret key used to sign and validate JWT tokens.
    private final SecretKey SECRET_KEY =
            Keys.hmacShaKeyFor("liquidly-secret-key-liquidly-secret-key".getBytes());

    // Generate a signed JWT token for the given email subject.
    public String generateToken(String email) {

        return Jwts.builder()
                .setSubject(email)
                .setIssuedAt(new Date())
                .setExpiration(new Date(System.currentTimeMillis() + 3600000))
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
