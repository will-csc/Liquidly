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
    private JwtService jwtService;

    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@RequestBody SignupRequest request) {
        return ResponseEntity.ok(userService.signup(request));
    }

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

    @PostMapping("/login-face")
    public ResponseEntity<UserDTO> loginFace(@RequestBody FaceLoginRequest request) {
        return ResponseEntity.ok(userService.loginFace(request));
    }

    @PostMapping
    public ResponseEntity<UserDTO> createUser(@RequestBody User user) {
        return ResponseEntity.ok(userService.createUser(user));
    }

    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        return ResponseEntity.ok(userService.getAllUsers());
    }

    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> emailExists(@RequestParam String email) {
        return ResponseEntity.ok(Map.of("exists", userService.emailExists(email)));
    }

    @PostMapping("/recovery/send-code")
    public ResponseEntity<Map<String, String>> sendRecoveryCode(@RequestBody Map<String, String> payload) {
        userService.sendRecoveryCodeEmail(payload.get("email"));
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @PostMapping("/recovery/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        return ResponseEntity.ok(userService.getUserById(id));
    }

    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        userService.deleteUser(id);
    }
}
