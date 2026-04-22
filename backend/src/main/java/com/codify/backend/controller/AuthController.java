package com.codify.backend.controller;

import java.time.LocalDateTime;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.http.HttpStatus;
import java.util.*;
import com.codify.backend.model.Otp;
import com.codify.backend.model.User;
import com.codify.backend.dto.LoginRequest;
import com.codify.backend.repository.UserRepository;
import com.codify.backend.service.JwtService;
import com.sendgrid.SendGrid;
import com.sendgrid.Request;
import com.sendgrid.Response;
import com.sendgrid.helpers.mail.Mail;
import com.sendgrid.helpers.mail.objects.Content;
import com.sendgrid.helpers.mail.objects.Email;
import com.sendgrid.Method;
import lombok.RequiredArgsConstructor;
import com.codify.backend.dto.RegisterRequest;
import org.springframework.security.core.Authentication;
import com.codify.backend.repository.OtpRepository;
import java.time.LocalDate;
import com.codify.backend.service.UserService;
import com.codify.backend.dto.UpdatePasswordRequest;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/auth")
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserService userService;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final OtpRepository otpRepository;
    private final Random random = new Random();

    @org.springframework.beans.factory.annotation.Value("${spring.sendgrid.api-key}")
    private String sendgridApiKey;

    @PostMapping("/login") 
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
       try {
            // Authenticate the user using AuthenticationManager
            Authentication authentication = authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
            );

            SecurityContextHolder.getContext().setAuthentication(authentication);

            User user = userRepository.findByEmail(request.getEmail())
                    .orElseThrow(() -> new RuntimeException("User not found"));
        
            String token = jwtService.generateToken(user);

            Map<String, Object> response = new HashMap<>();
            response.put("id", user.getId());
            response.put("username", user.getUsername());
            response.put("email", user.getEmail());
            response.put("role", user.getRole());
            response.put("profilePictureId", user.getProfilePictureId());
            response.put("token", token);
            response.put("attemptedQuestions", user.getAttemptedQuestions());
            response.put("solvedQuestions", user.getSolvedQuestions());
            response.put("totalSubmissions", user.getTotalSubmissions());
            response.put("totalSolved", user.getTotalSolved());
            response.put("easySolved", user.getEasySolved());
            response.put("mediumSolved", user.getMediumSolved());
            response.put("hardSolved", user.getHardSolved());
            response.put("message", "Login successful");

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body("Invalid email or password");
        }
       
    }
    public String generateOtp() {
        return String.format("%06d", random.nextInt(999999));
    }
    @PostMapping("/send-otp")
     public ResponseEntity<String> sendOtp(String email) {
        otpRepository.deleteByEmail(email);

        String code = generateOtp();
        LocalDateTime expiresAt = LocalDateTime.now().plusMinutes(30);
      try{
        Otp otp = Otp.builder()
                .email(email)
                .code(code)
                .expiry(expiresAt)
                .build();

        otpRepository.save(otp);
        sendOtpEmail(email, code);

      } catch(Exception e) {
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Failed to send OTP. Please try again.");
      }

        return ResponseEntity.ok("OTP sent successfully");
    }
    public boolean verifyOtp(String email, String code) {
        return otpRepository.findByEmailAndCode(email, code) != null && 
               otpRepository.findByEmailAndCode(email, code).getExpiry().isAfter(LocalDateTime.now());
    }
    public void sendOtpEmail(String email, String code) {
        String subject = "Your Codify Verification Code";
        String textContent = """
                <div style="font-family: Arial; text-align: center; padding: 20px;">
                    <h2>Your verification code is</h2>
                    <h1 style="font-size: 48px; letter-spacing: 10px; color: #6e44ff;">%s</h1>
                    <p>It expires in 30 minutes.</p>
                </div>
                """.formatted(code);
          
        String key = sendgridApiKey;
        Email from = new Email("wavvlyofficial@gmail.com");
        Email to = new Email(email);
        Content content = new Content("text/plain", textContent);
        Mail mail = new Mail(from, subject, to, content);

        SendGrid sg = new SendGrid(key);
        Request request = new Request();
        try {
            request.setMethod(Method.POST);
            request.setEndpoint("mail/send");
            request.setBody(mail.build());
            Response response = sg.api(request);
            System.out.println(response.getStatusCode());
            System.out.println(response.getBody());
            System.out.println(response.getHeaders());
           
        } catch (Exception ex) {
            System.out.println(ex);
        }
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        if(userRepository.findByEmail(request.getEmail()).isPresent()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Email already in use");
        }
        if(!verifyOtp(request.getEmail(), request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or expired OTP");
        }

        User user = User.builder()
                .userName(request.getUsername())
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .country(request.getCountry())
                .role("USER")
                .registrationDate(LocalDate.now())
                .profilePictureId(request.getProfilePictureId())
                .solvedQuestions(new HashSet<>())
                .attemptedQuestions(new HashSet<>())
                .totalSubmissions(0)
                .totalSolved(0)
                .easySolved(0)
                .mediumSolved(0)
                .hardSolved(0)
                .build();

        userRepository.save(user);
        otpRepository.deleteByEmail(request.getEmail());
         
        String token = jwtService.generateToken(user);
        Map<String, Object> response = new HashMap<>();
        response.put("id", user.getId());
        response.put("username", user.getUsername());
        response.put("email", user.getEmail());
        response.put("role", user.getRole());
        response.put("token", token);
        response.put("message", "Registration successful");
        return ResponseEntity.ok(response);
    }
    @PatchMapping("/update-password")
    public ResponseEntity<?> updatePassword(@RequestBody UpdatePasswordRequest request) {
        User user = userService.getUserProfileByEmail(request.getEmail());
        if(user == null) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("User not found");
        }
        if(!verifyOtp(request.getEmail(), request.getOtp())) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body("Invalid or expired OTP");
        }
        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        otpRepository.deleteByEmail(request.getEmail());
        return ResponseEntity.ok("Password updated successfully");
    }

}
