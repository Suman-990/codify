package com.codify.backend.dto;

import lombok.Data;

@Data
public class UpdatePasswordRequest {
    private String email;
    private String otp;
    private String newPassword;   
}
