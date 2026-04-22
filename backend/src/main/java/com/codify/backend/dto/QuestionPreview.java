package com.codify.backend.dto;

import java.util.List;

import lombok.Builder;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class QuestionPreview {
    private Long id;
    private String title;
    private String difficulty;
    private double acceptanceRate;
    private List<String> tags;
}
