package com.codify.backend.dto;

import lombok.Data;

@Data
public class CreateSolutionDto {
   
    private String language;
    private String code;
    private Long userId;
    private String userName;
    private Long questionId;
    private Integer executionTime;
    private String aproach;
    private String timeComplexity;
    private String spaceComplexity;

}
