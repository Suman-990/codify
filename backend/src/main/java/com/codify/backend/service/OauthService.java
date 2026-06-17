package com.codify.backend.service;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Map;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;

import com.codify.backend.model.User;
import com.codify.backend.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class OauthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    
     public ResponseEntity<?> handleOauth2Login(OAuth2User oauthUser) {
        String email = oauthUser.getAttribute("email");
        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = User.builder()
                    .email(email)
                    .userName(oauthUser.getAttribute("name"))
                    .password(passwordEncoder.encode(UUID.randomUUID().toString()))
                    .role("USER")
                    .registrationDate(LocalDate.now())
                    .profilePictureId(0)
                    .solvedQuestions(new HashSet<>())
                    .attemptedQuestions(new HashSet<>())
                    .totalSubmissions(0)
                    .totalSolved(0)
                    .easySolved(0)
                    .mediumSolved(0)
                    .hardSolved(0)
                    .build();
            return userRepository.save(newUser);
        });
        String token = jwtService.generateToken(user);
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUserName());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("token", token);
        response.put("message", "Login successful");
        return ResponseEntity.ok(response);
    }
}
