package com.codify.backend.dto;

import lombok.Data;

@Data
public class CreateDiscussionDto {
 private Long questionId;
 private Long userId;
    private String userName;
    private int userProfilePicture;
    private String content; 
}
