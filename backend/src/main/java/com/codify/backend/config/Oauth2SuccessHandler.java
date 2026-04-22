package com.codify.backend.config;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.Map;

import com.codify.backend.service.OauthService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.AuthenticationSuccessHandler;
import org.springframework.stereotype.Component;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.util.UriComponentsBuilder;

@Component
@RequiredArgsConstructor
public class Oauth2SuccessHandler implements AuthenticationSuccessHandler {

    private final OauthService oauthService;
    // Remove ObjectMapper if not needed elsewhere

    private final String frontendUrl = "http://localhost:5173/auth/callback";   // ← Change this for production

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request,
                                        HttpServletResponse response,
                                        Authentication authentication) throws IOException, ServletException {

        OAuth2User oauthUser = (OAuth2User) authentication.getPrincipal();

        // Get the response data from your service (Map with token, user info, etc.)
        var result = oauthService.handleOauth2Login(oauthUser);
        @SuppressWarnings("unchecked")
        Map<String, Object> data = (Map<String, Object>) result.getBody();

        if (data == null || !data.containsKey("token")) {
            response.sendError(HttpServletResponse.SC_INTERNAL_SERVER_ERROR, "Failed to generate token");
            return;
        }

        String token = (String) data.get("token");
        String role = (String) data.get("role");
        String email = (String) data.get("email");
        Object id = data.get("id");
        String username = (String) data.get("username");
        String message = (String) data.get("message");

        // Build redirect URL with all necessary data
        String redirectUrl = UriComponentsBuilder.fromUriString(frontendUrl)
                .queryParam("token", URLEncoder.encode(token, StandardCharsets.UTF_8))
                .queryParam("role", role)
                .queryParam("email", URLEncoder.encode(email, StandardCharsets.UTF_8))
                .queryParam("id", id)
                .queryParam("username", URLEncoder.encode(username != null ? username : email, StandardCharsets.UTF_8))
                .queryParam("message", URLEncoder.encode(message != null ? message : "Login successful", StandardCharsets.UTF_8))
                .build()
                .toUriString();

        // Redirect to React frontend
        response.sendRedirect(redirectUrl);
    }
}
