package com.liquidly.api.controller;

import com.liquidly.api.dto.LoginRequest;
import com.liquidly.api.dto.FaceLoginRequest;
import com.liquidly.api.dto.ResetPasswordRequest;
import com.liquidly.api.dto.SignupRequest;
import com.liquidly.api.dto.UserDTO;
import com.liquidly.api.model.User;
import com.liquidly.api.service.UserService;
import com.liquidly.api.security.JwtService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    @Autowired
    private UserService userService;
    @Autowired
    private JwtService jwtService;

    // Register a new user account.
    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(userService.signup(request));
    }

    // Authenticate by email/password and return a JWT token plus user payload.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {

        UserDTO user = userService.login(request);
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "user", user
                )
        );
    }

    // Authenticate by face image and return a JWT token plus user payload.
    @PostMapping("/login-face")
    public ResponseEntity<?> loginFace(@RequestBody FaceLoginRequest request) {
        UserDTO user = userService.loginFace(request);
        String token = jwtService.generateToken(user.getEmail());
        return ResponseEntity.ok(
                Map.of(
                        "token", token,
                        "user", user
                )
        );
    }

    // Create a user using the legacy endpoint (signup is preferred).
    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    // Return all users as DTOs.
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }
    
    // Check if an email is already registered.
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> emailExists(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("exists", userService.emailExists(email)));
    }

    // Trigger sending a password recovery code via the email service.
    @PostMapping("/recovery/send-code")
    public ResponseEntity<Map<String, String>> sendRecoveryCode(@RequestBody Map<String, String> payload) {
        userService.sendRecoveryCodeEmail(payload.get("email"));
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    // Reset a password using the previously delivered recovery code.
    @PostMapping("/recovery/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    // Return a user by id.
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    // Delete a user by id.
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
