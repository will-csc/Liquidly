package com.liquidly.api.dto;

import lombok.Data;

@Data
// Request payload for user signup.
public class SignupRequest {
    private String name;
    private String email;
    private String password;
    private String companyName;
    private String faceImage;
}
