package com.codify.backend.dto;

import lombok.Builder;
import lombok.Data;
import lombok.AllArgsConstructor;
@Data
@Builder
@AllArgsConstructor
public class AiAnalysis {
  private String timeComplexity;
  private String spaceComplexity;
  private String description;
}
