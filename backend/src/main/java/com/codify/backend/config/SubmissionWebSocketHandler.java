package com.codify.backend.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArraySet;

/**
 * Central WebSocket handler for the submission pipeline.
 *
 * Responsibilities:
 *  1. Maintain a "room" per questionId: a set of all sessions currently on that question page.
 *  2. Broadcast the live "actively attempting" count to every session in a room on connect/disconnect.
 *  3. Route a specific submission result to exactly the session that submitted it.
 *
 * Thread-safety:
 *  - ConcurrentHashMap for the room map (concurrent connect/disconnect from Tomcat WS threads).
 *  - CopyOnWriteArraySet per room so broadcast iteration is safe while other threads modify the set.
 *  - ConcurrentHashMap for the pendingSubmissions map (written by SubmitController, read by SubmitService).
 */
@Component
@Slf4j
public class SubmissionWebSocketHandler extends TextWebSocketHandler {

    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * questionId (as String) → set of all currently-connected WebSocket sessions on that question page.
     */
    private final ConcurrentHashMap<String, CopyOnWriteArraySet<WebSocketSession>> questionSessions =
            new ConcurrentHashMap<>();

    /**
     * submissionId → the specific WebSocket session waiting for that submission's result.
     * Populated by SubmitController immediately after creating the submission DB record.
     * Cleared (and result sent) by notifySubmissionResult() when judging completes.
     */
    private final ConcurrentHashMap<Long, WebSocketSession> pendingSubmissions =
            new ConcurrentHashMap<>();

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle callbacks
    // ─────────────────────────────────────────────────────────────────────────

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String questionId = (String) session.getAttributes().get("questionId");
        if (questionId == null) {
            log.warn("WS session {} connected without questionId attribute — closing", session.getId());
            closeQuietly(session);
            return;
        }
        questionSessions
                .computeIfAbsent(questionId, k -> new CopyOnWriteArraySet<>())
                .add(session);
        log.info("WS connected: session={} questionId={} totalOnQuestion={}",
                session.getId(), questionId, questionSessions.get(questionId).size());
        broadcastActiveUsers(questionId);
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        String questionId = (String) session.getAttributes().get("questionId");
        if (questionId != null) {
            CopyOnWriteArraySet<WebSocketSession> sessions = questionSessions.get(questionId);
            if (sessions != null) {
                sessions.remove(session);
                if (sessions.isEmpty()) {
                    questionSessions.remove(questionId);
                }
            }
            broadcastActiveUsers(questionId);
            log.info("WS disconnected: session={} questionId={} status={}", session.getId(), questionId, status);
        }
        // Clean up any pending submission registered for this session
        pendingSubmissions.entrySet().removeIf(e -> e.getValue().getId().equals(session.getId()));
    }

    @Override
    public void handleTransportError(WebSocketSession session, Throwable exception) {
        log.error("WS transport error on session {}: {}", session.getId(), exception.getMessage());
        afterConnectionClosed(session, CloseStatus.SERVER_ERROR);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Public API — called by SubmitController and SubmitService
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Called by SubmitController right after creating the Submission DB record.
     * Links the submissionId to the specific WebSocket session of the user who submitted,
     * so that when the result arrives from SubmitService we know exactly where to send it.
     *
     * @param submissionId the newly created submission ID
     * @param userId       the user who submitted (used to find their session in the room)
     * @param questionId   the question the user is on (used to look up their room)
     */
    public void registerPendingSubmission(Long submissionId, Long userId, String questionId) {
        Set<WebSocketSession> sessions = questionSessions.get(questionId);
        if (sessions == null || sessions.isEmpty()) {
            log.warn("registerPendingSubmission: no sessions found for questionId={}", questionId);
            return;
        }
        sessions.stream()
                .filter(s -> s.isOpen() && userId.toString().equals(s.getAttributes().get("userId")))
                .findFirst()
                .ifPresentOrElse(
                        s -> {
                            pendingSubmissions.put(submissionId, s);
                            log.info("Registered pending submission {} for session {}", submissionId, s.getId());
                        },
                        () -> log.warn("registerPendingSubmission: could not find open session for userId={} on questionId={}",
                                userId, questionId)
                );
    }

    /**
     * Called by SubmitService after the Docker judge finishes and the result is saved to DB.
     * Pushes a RESULT message to the specific session that was waiting for this submission.
     *
     * @param submissionId the judged submission's ID
     * @param verdict      e.g. "PASS", "FAIL", "RUNTIME_ERROR", "TIME_LIMIT_EXCEEDED"
     * @param status       always "EXECUTED" at this point
     */
    public void notifySubmissionResult(Long submissionId, String verdict, String status) {
        WebSocketSession session = pendingSubmissions.remove(submissionId);
        if (session == null) {
            log.warn("notifySubmissionResult: no pending session for submissionId={}", submissionId);
            return;
        }
        if (!session.isOpen()) {
            log.warn("notifySubmissionResult: session for submissionId={} is already closed", submissionId);
            return;
        }
        sendJson(session, Map.of(
                "type", "RESULT",
                "submissionId", submissionId,
                "verdict", verdict,
                "status", status
        ));
        log.info("Pushed RESULT for submissionId={} verdict={} to session={}", submissionId, verdict, session.getId());
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Internal helpers
    // ─────────────────────────────────────────────────────────────────────────

    /**
     * Sends {"type":"ACTIVE_USERS","count":N} to every session currently on this question page.
     */
    private void broadcastActiveUsers(String questionId) {
        Set<WebSocketSession> sessions = questionSessions.getOrDefault(questionId, new CopyOnWriteArraySet<>());
        int count = sessions.size();
        Map<String, Object> msg = Map.of("type", "ACTIVE_USERS", "count", count);
        sessions.forEach(s -> sendJson(s, msg));
        log.debug("Broadcasted ACTIVE_USERS count={} to questionId={}", count, questionId);
    }

    private void sendJson(WebSocketSession session, Object payload) {
        if (!session.isOpen()) return;
        try {
            String json = objectMapper.writeValueAsString(payload);
            synchronized (session) {
                session.sendMessage(new TextMessage(json));
            }
        } catch (Exception e) {
            log.error("Failed to send WS message to session {}: {}", session.getId(), e.getMessage());
        }
    }

    private void closeQuietly(WebSocketSession session) {
        try {
            session.close(CloseStatus.NOT_ACCEPTABLE);
        } catch (Exception ignored) {}
    }
}
