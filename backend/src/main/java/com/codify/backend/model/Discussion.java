package com.codify.backend.model;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
@Entity
@Table(name = "discussions")
public class Discussion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long questionId;
    private Long userId;
    private String userName;
    private int userProfilePicture;
    @Column(columnDefinition = "TEXT")
    private String content;
    private LocalDateTime timestamp;
}
