package com.liquidly.api.controller;

import com.liquidly.api.security.JwtService;
import com.liquidly.api.service.UserService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserControllerTest {

    @Mock
    private UserService userService;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private UserController userController;

    @Test
    void shouldInvalidateCurrentSessionOnLogout() {
        when(jwtService.extractSessionId("token-123")).thenReturn("session-123");

        var response = userController.logout("Bearer token-123");

        assertEquals(200, response.getStatusCode().value());
        assertEquals("ok", response.getBody().get("message"));
        verify(jwtService).extractSessionId("token-123");
        verify(userService).logout("session-123");
    }
}
