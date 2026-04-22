package com.codify.backend.model;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import jakarta.persistence.*;
import lombok.Builder;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Entity
@Builder
@Table(name = "questions")
public class Question {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    private String exampleInput;
    private String exampleOutput;
    private String difficulty;
    @Column(columnDefinition = "TEXT")
    private String main_java;
    @Column(columnDefinition = "TEXT")
    private String main_python;
    @Column(columnDefinition = "TEXT")
    private String main_cpp;
    private String solution_java;
    private String solution_python;
    private String solution_cpp;
    private int totalSubmissions;
    private int totalAccepted;
    private double acceptanceRate;
    @ElementCollection
    private List<String> tags;
    @ElementCollection
    private List<String> constraints;
    @ElementCollection
    private List<String> hints;
    @ElementCollection
    private Map<Integer,Integer> executionTimes;
}
