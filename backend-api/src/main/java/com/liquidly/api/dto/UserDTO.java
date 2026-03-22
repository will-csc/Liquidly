package com.liquidly.api.dto;

import lombok.Data;

@Data
// Response payload representing a user (excluding sensitive fields like password).
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private Long companyId;
    private String companyName;
}
