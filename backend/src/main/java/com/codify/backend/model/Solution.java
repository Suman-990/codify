package com.codify.backend.model;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.*;
import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "solutions")
public class Solution {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String language;
    @Column(columnDefinition = "TEXT")
    private String code;
    private Long userId;
    private int userProfilePicture;
    private String userName;
    private Long questionId;
    private Integer executionTime;
    private String aproach;
    private String timeComplexity;
    private String spaceComplexity;
    private LocalDateTime createdAt;
}
