package com.codify.backend.config;

import com.codify.backend.service.CustomUserDetailsService;
import com.codify.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.net.URI;
import java.util.Map;

/**
 * Authenticates a WebSocket handshake request using the JWT passed as a query parameter.
 *
 * WHY query param (not Authorization header):
 *   The browser's native WebSocket API does not allow setting custom HTTP headers
 *   at connection time. The standard workaround is to pass the token as:
 *     ws://host/ws/question/{questionId}?token=<JWT>&userId=<id>
 *
 * On success the following attributes are stored on the session for use by the handler:
 *   - "questionId" (String)  — extracted from the URI path
 *   - "userEmail"  (String)  — extracted from the validated JWT
 *   - "userId"     (String)  — passed as query param; used to route submission results
 *
 * On failure the HTTP response is set to 401 and the handshake is rejected.
 */
@Slf4j
@RequiredArgsConstructor
public class JwtHandshakeInterceptor implements HandshakeInterceptor {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public boolean beforeHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Map<String, Object> attributes) {

        URI uri = request.getURI();
        String query = uri.getQuery(); // e.g. "token=eyJ...&userId=42"

        if (query == null) {
            log.warn("WS handshake rejected: no query parameters on {}", uri);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        String token = null;
        String userId = null;

        for (String param : query.split("&")) {
            if (param.startsWith("token=")) {
                token = param.substring(6);
            } else if (param.startsWith("userId=")) {
                userId = param.substring(7);
            }
        }

        if (token == null || token.isBlank()) {
            log.warn("WS handshake rejected: missing token on {}", uri);
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }

        try {
            String email = jwtService.extractUsername(token);
            if (email == null) {
                log.warn("WS handshake rejected: could not extract username from token");
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }
            UserDetails userDetails = userDetailsService.loadUserByUsername(email);
            if (!jwtService.isTokenValid(token, userDetails)) {
                log.warn("WS handshake rejected: invalid token for {}", email);
                response.setStatusCode(HttpStatus.UNAUTHORIZED);
                return false;
            }

            // Extract questionId from the URI path: /ws/question/{questionId}
            String path = uri.getPath();
            String questionId = path.substring(path.lastIndexOf('/') + 1);

            attributes.put("questionId", questionId);
            attributes.put("userEmail", email);
            if (userId != null && !userId.isBlank()) {
                attributes.put("userId", userId);
            }

            log.info("WS handshake accepted: email={} questionId={} userId={}", email, questionId, userId);
            return true;

        } catch (Exception e) {
            log.error("WS handshake error: {}", e.getMessage());
            response.setStatusCode(HttpStatus.UNAUTHORIZED);
            return false;
        }
    }

    @Override
    public void afterHandshake(
            ServerHttpRequest request,
            ServerHttpResponse response,
            WebSocketHandler wsHandler,
            Exception exception) {
        // Nothing needed after handshake
    }
}
