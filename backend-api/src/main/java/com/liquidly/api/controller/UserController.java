package com.liquidly.api.controller;

import com.liquidly.api.dto.LoginRequest;
import com.liquidly.api.dto.FaceLoginRequest;
import com.liquidly.api.dto.ResetPasswordRequest;
import com.liquidly.api.dto.SignupRequest;
import com.liquidly.api.dto.UserDTO;
import com.liquidly.api.model.User;
import com.liquidly.api.service.UserService;
import com.liquidly.api.security.JwtService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;


import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "*")
public class UserController {

    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @Autowired
    private UserService userService;
    @Autowired
    private JwtService jwtService;

    // Register a new user account.
    @PostMapping("/signup")
    public ResponseEntity<UserDTO> signup(@RequestBody SignupRequest request) {
        logger.info("Recebido signup: email={}, companyName={}", request.getEmail(), request.getCompanyName());
        UserDTO createdUser = userService.signup(request);
        logger.info("Signup concluido: userId={}, email={}, companyId={}",
                createdUser.getId(), createdUser.getEmail(), createdUser.getCompanyId());
        return ResponseEntity.ok(createdUser);
    }

    // Authenticate by email/password and return a JWT token plus user payload.
    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        logger.info("Recebido login por email: email={}", request.getEmail());

        UserDTO user = userService.login(request);
        String token = jwtService.generateToken(user.getEmail());
        logger.info("Login concluido: userId={}, email={}, companyId={}", user.getId(), user.getEmail(), user.getCompanyId());
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
        logger.info("Recebido login facial");
        UserDTO user = userService.loginFace(request);
        String token = jwtService.generateToken(user.getEmail());
        logger.info("Login facial concluido: userId={}, email={}, companyId={}", user.getId(), user.getEmail(), user.getCompanyId());
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
        logger.info("Recebido createUser legado: email={}", user.getEmail());
        UserDTO createdUser = userService.createUser(user);
        logger.info("CreateUser legado concluido: userId={}, email={}, companyId={}",
                createdUser.getId(), createdUser.getEmail(), createdUser.getCompanyId());
        return ResponseEntity.ok(createdUser);
    }

    // Return all users as DTOs.
    @GetMapping
    public ResponseEntity<List<UserDTO>> getAllUsers() {
        List<UserDTO> users = userService.getAllUsers();
        logger.info("Listagem de usuarios concluida: total={}", users.size());
        return ResponseEntity.ok(users);
    }
    
    // Check if an email is already registered.
    @GetMapping("/exists")
    public ResponseEntity<Map<String, Boolean>> emailExists(@RequestParam String email) {
        boolean exists = userService.emailExists(email);
        logger.info("Consulta de email existente: email={}, exists={}", email, exists);
        return ResponseEntity.ok(Map.of("exists", exists));
    }

    // Trigger sending a password recovery code via the email service.
    @PostMapping("/recovery/send-code")
    public ResponseEntity<Map<String, String>> sendRecoveryCode(@RequestBody Map<String, String> payload) {
        String email = payload.get("email");
        logger.info("Recebido envio de codigo de recuperacao: email={}", email);
        userService.sendRecoveryCodeEmail(email);
        logger.info("Envio de codigo de recuperacao concluido: email={}", email);
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    // Reset a password using the previously delivered recovery code.
    @PostMapping("/recovery/reset-password")
    public ResponseEntity<Map<String, String>> resetPassword(@RequestBody ResetPasswordRequest request) {
        logger.info("Recebido reset de senha: email={}", request.getEmail());
        userService.resetPassword(request.getEmail(), request.getCode(), request.getNewPassword());
        logger.info("Reset de senha concluido: email={}", request.getEmail());
        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    // Return a user by id.
    @GetMapping("/{id}")
    public ResponseEntity<UserDTO> getUserById(@PathVariable Long id) {
        logger.info("Buscando usuario por id={}", id);
        UserDTO user = userService.getUserById(id);
        logger.info("Usuario encontrado: userId={}, email={}, companyId={}", user.getId(), user.getEmail(), user.getCompanyId());
        return ResponseEntity.ok(user);
    }

    // Delete a user by id.
    @DeleteMapping("/{id}")
    public void deleteUser(@PathVariable Long id) {
        logger.info("Recebido delete de usuario: userId={}", id);
        userService.deleteUser(id);
        logger.info("Delete de usuario concluido: userId={}", id);
    }
}
