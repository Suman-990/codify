package com.codify.backend.model;

import java.time.LocalDate;
import java.util.*;
import jakarta.persistence.*;
import lombok.*;
import com.fasterxml.jackson.annotation.JsonIgnore;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "users")
public class User implements UserDetails {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String email;
    private String password;
    private String role;
    private String userName;
    private String country;
    private int profilePictureId;
    private LocalDate registrationDate;
    @ElementCollection
    private Set<Long> solvedQuestions;
    @ElementCollection
    private Set<Long> attemptedQuestions;
    @ElementCollection
    private Map<String, Integer> dailySubmissions;
    private int totalSubmissions;
    private int totalSolved;
    private int easySolved;
    private int mediumSolved;
    private int hardSolved;
 
      @Override
public Collection<? extends GrantedAuthority> getAuthorities() {
    return List.of(new SimpleGrantedAuthority("ROLE_" + role));
}

public String getUserName() {
    return userName;
}

@Override
@JsonIgnore
public String getUsername() {
    return email;
}
}
