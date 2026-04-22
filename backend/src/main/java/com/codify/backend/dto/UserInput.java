package com.codify.backend.dto;

import lombok.Data;

@Data
public class UserInput {
    private String userCode;
    private Long questionId;
    private Long userId;
}
