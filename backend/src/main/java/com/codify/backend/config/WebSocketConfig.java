package com.codify.backend.config;

import com.codify.backend.service.CustomUserDetailsService;
import com.codify.backend.service.JwtService;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

/**
 * Registers the WebSocket endpoint and wires the handler + handshake interceptor.
 *
 * Endpoint pattern: /ws/question/{questionId}
 *   - {questionId} is a plain path segment (not a Spring MVC path variable — WS doesn't support those).
 *     The actual value is extracted inside JwtHandshakeInterceptor from the URI path.
 *
 * Allowed origins must match the frontend dev server and any production URL.
 */
@Configuration
@EnableWebSocket
@RequiredArgsConstructor
public class WebSocketConfig implements WebSocketConfigurer {

    private final SubmissionWebSocketHandler submissionWebSocketHandler;
    private final JwtService jwtService;
    private final CustomUserDetailsService customUserDetailsService;

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
                .addHandler(submissionWebSocketHandler, "/ws/question/*")
                .setAllowedOrigins(
                        "http://localhost:5173",
                        "http://localhost:3001"
                )
                .addInterceptors(new JwtHandshakeInterceptor(jwtService, customUserDetailsService));
    }
}
