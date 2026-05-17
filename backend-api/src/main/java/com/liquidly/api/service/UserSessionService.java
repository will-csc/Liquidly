package com.liquidly.api.service;

import com.liquidly.api.model.User;
import com.liquidly.api.model.UserSession;
import com.liquidly.api.repository.UserRepository;
import com.liquidly.api.repository.UserSessionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class UserSessionService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;

    public UserSessionService(UserRepository userRepository, UserSessionRepository userSessionRepository) {
        this.userRepository = userRepository;
        this.userSessionRepository = userSessionRepository;
    }

    @Transactional
    public void registerSession(Long userId, String sessionId, Instant expiresAt) {
        purgeExpiredSessions();

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));

        UserSession session = new UserSession();
        session.setUser(user);
        session.setSessionId(sessionId);
        session.setExpiresAt(expiresAt);
        userSessionRepository.save(session);
    }

    @Transactional
    public void logout(String sessionId) {
        if (sessionId == null || sessionId.isBlank()) return;
        userSessionRepository.deleteBySessionId(sessionId.trim());
    }

    @Transactional
    public boolean isSessionActive(String email, String sessionId) {
        if (email == null || email.isBlank() || sessionId == null || sessionId.isBlank()) {
            return false;
        }
        purgeExpiredSessions();
        return userSessionRepository.existsBySessionIdAndUserEmailAndExpiresAtAfter(
                sessionId.trim(),
                email.trim(),
                Instant.now()
        );
    }

    @Transactional
    public boolean hasOtherActiveSessions(Long userId, String currentSessionId) {
        if (userId == null) return false;

        purgeExpiredSessions();
        Instant now = Instant.now();

        if (currentSessionId == null || currentSessionId.isBlank()) {
            return userSessionRepository.countByUserIdAndExpiresAtAfter(userId, now) > 0;
        }

        return userSessionRepository.countByUserIdAndExpiresAtAfterAndSessionIdNot(
                userId,
                now,
                currentSessionId.trim()
        ) > 0;
    }

    @Transactional
    public void deleteAllSessionsForUser(Long userId) {
        if (userId == null) return;
        userSessionRepository.deleteByUserId(userId);
    }

    @Transactional
    public void purgeExpiredSessions() {
        userSessionRepository.deleteByExpiresAtBefore(Instant.now());
    }
}
