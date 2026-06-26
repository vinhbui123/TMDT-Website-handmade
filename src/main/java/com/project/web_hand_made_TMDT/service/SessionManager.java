package com.project.web_hand_made_TMDT.service;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;

import org.springframework.stereotype.Component;

import jakarta.servlet.http.HttpSession;

@Component
public class SessionManager {

    // Map UserId -> List of HttpSessions
    private final Map<Integer, List<HttpSession>> userSessions = new ConcurrentHashMap<>();

    public void addSession(int userId, HttpSession session) {
        userSessions.computeIfAbsent(userId, k -> new CopyOnWriteArrayList<>()).add(session);
    }

    public void removeSession(int userId, String sessionId) {
        List<HttpSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            sessions.removeIf(s -> s.getId().equals(sessionId));
        }
    }

    public void invalidateOtherSessions(int userId, String currentSessionId) {
        List<HttpSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (HttpSession session : sessions) {
                if (!session.getId().equals(currentSessionId)) {
                    try {
                        session.invalidate();
                    } catch (IllegalStateException e) {
                        // Session might already be invalidated
                    }
                }
            }
            // Retain only the current session
            sessions.removeIf(s -> !s.getId().equals(currentSessionId));
        }
    }
    
    public void invalidateAllSessions(int userId) {
        List<HttpSession> sessions = userSessions.get(userId);
        if (sessions != null) {
            for (HttpSession session : sessions) {
                try {
                    session.invalidate();
                } catch (IllegalStateException e) {
                    // Ignore
                }
            }
            userSessions.remove(userId);
        }
    }
}
