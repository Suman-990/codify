package com.codify.backend.dto;

import java.util.List;
import lombok.Data;

@Data
public class CreateQuestionDto {
    
    private String title;
    private String description;
    private String exampleInput;
    private String exampleOutput;
    private String difficulty;
    private String main_java;
    private String main_python;
    private String main_cpp;
    private String solution_java;
    private String solution_python;
    private String solution_cpp;
    private List<String> tags;
    private List<String> constraints;
}
