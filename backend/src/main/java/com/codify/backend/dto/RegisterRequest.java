package com.codify.backend.dto;


import lombok.Data;

@Data
public class RegisterRequest {
  private String username;
    private String email;
    private String password;
    private String otp;
    private String country;
    private int profilePictureId;
}
