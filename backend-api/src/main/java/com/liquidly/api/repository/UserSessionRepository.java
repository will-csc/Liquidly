package com.liquidly.api.repository;

import com.liquidly.api.model.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, Long> {
    boolean existsBySessionIdAndUserEmailAndExpiresAtAfter(String sessionId, String email, Instant expiresAt);
    long countByUserIdAndExpiresAtAfterAndSessionIdNot(Long userId, Instant expiresAt, String sessionId);
    long countByUserIdAndExpiresAtAfter(Long userId, Instant expiresAt);
    void deleteBySessionId(String sessionId);
    void deleteByUserId(Long userId);
    long deleteByExpiresAtBefore(Instant expiresAt);
}
