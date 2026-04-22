package com.codify.backend.model;
 import jakarta.persistence.Entity;
 import jakarta.persistence.GeneratedValue;
 import jakarta.persistence.GenerationType;
 import jakarta.persistence.Id;
 import lombok.*;
 import jakarta.persistence.*;
 import java.time.LocalDateTime;
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
 @Entity
 @Builder
 @Table(name = "submissions")
public class Submission {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    @Column(columnDefinition = "TEXT")
    private String userCode;
    private Long questionId;
    private String questionTitle;
    private String language;
    private String status; // pending,executed
    private Long userId;
    private String verdict;
    private LocalDateTime createdAt;
    private String timeComplexity;
    private String spaceComplexity;
    private String executionTime;
    private String totalPassed;
}
