package com.liquidly.api.dto;

import lombok.Data;

@Data
// Request payload for password reset using a recovery code.
public class ResetPasswordRequest {
    private String email;
    private String code;
    private String newPassword;
}
