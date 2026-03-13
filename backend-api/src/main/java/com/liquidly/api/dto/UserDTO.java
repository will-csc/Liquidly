package com.liquidly.api.dto;

import lombok.Data;

@Data
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private Long companyId;
    private String companyName;
}
