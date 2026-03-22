package com.liquidly.api.dto;

import lombok.Data;

@Data
// Request payload for email/password login.
public class LoginRequest {
    private String email;
    private String password;
}
