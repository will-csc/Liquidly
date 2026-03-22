package com.liquidly.api.service;

import com.liquidly.api.dto.LoginRequest;
import com.liquidly.api.dto.FaceLoginRequest;
import com.liquidly.api.dto.SignupRequest;
import com.liquidly.api.dto.UserDTO;
import com.liquidly.api.model.Company;
import com.liquidly.api.model.User;
import com.liquidly.api.repository.CompanyRepository;
import com.liquidly.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.security.SecureRandom;
import java.time.Duration;
import java.util.Base64;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;


@Service
public class UserService {

    private static final Logger logger = LoggerFactory.getLogger(UserService.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CompanyRepository companyRepository;

    @Value("${email.service.url:http://localhost:5000}")
    private String emailServiceUrl;

    @Value("${email.service.backupUrl:http://localhost:5000}")
    private String emailServiceBackupUrl;

    @Value("${email.service.apiKey:}")
    private String emailServiceApiKey;

    @Autowired
    private BCryptPasswordEncoder passwordEncoder;

    public UserDTO signup(SignupRequest request) {
        if (userRepository.findByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        
        validatePassword(request.getPassword());
        user.setPassword(passwordEncoder.encode(request.getPassword())); // In a real app, hash this!
        
        if (request.getFaceImage() != null) {
            user.setFaceImage(request.getFaceImage());
        }

        user.setRetrieveCode(generateUniqueRetrieveCode());

        // Handle Company
        if (request.getCompanyName() != null && !request.getCompanyName().isEmpty()) {
            Optional<Company> existingCompany = companyRepository.findByCompanyName(request.getCompanyName());
            if (existingCompany.isPresent()) {
                // If company exists, we check if there are users associated with it (optional rule, but requested "one account per company")
                // Interpreting "one account per company" as "only one user can register this company name" or "company name must be unique"
                // Given the request: "quero que seja uma conta por empresa" -> "I want one account per company"
                // This implies that if the company already exists, no one else can register with it (or it's already taken).
                
                // Let's assume the user means: "If company name exists, you cannot create another account for it" (Uniqueness of Company Name)
                throw new RuntimeException("This company is already registered");
            } else {
                Company newCompany = new Company();
                newCompany.setCompanyName(request.getCompanyName());
                user.setCompany(companyRepository.save(newCompany));
            }
        }

        user.setPassword(passwordEncoder.encode(user.getPassword()));
        User savedUser = userRepository.save(user);
        logger.info("Usuario criado: email={}, companyId={}", savedUser.getEmail(), savedUser.getCompany() == null ? null : savedUser.getCompany().getId());
        return mapToDTO(savedUser);
    }

    public UserDTO login(LoginRequest request) {
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new RuntimeException("This account doesn't exist"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) { // Simple comparison
            throw new RuntimeException("The password is wrong");
        }

        logger.info("Login sucesso: email={}", user.getEmail());
        return mapToDTO(user);
    }

    public UserDTO loginFace(FaceLoginRequest request) {
        if (request.getFaceImage() == null || request.getFaceImage().isEmpty()) {
            throw new RuntimeException("Face image is required");
        }

        List<User> usersWithFace = userRepository.findAll().stream()
                .filter(u -> u.getFaceImage() != null && !u.getFaceImage().isEmpty())
                .collect(Collectors.toList());

        for (User user : usersWithFace) {
            if (isFaceMatch(request.getFaceImage(), user.getFaceImage())) {
                return mapToDTO(user);
            }
        }

        throw new RuntimeException("Face not recognized");
    }

    public boolean emailExists(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        return userRepository.existsByEmail(email.trim());
    }

    public void sendRecoveryCodeEmail(String email) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("This account doesn't exist"));

        if (user.getRetrieveCode() == null || user.getRetrieveCode().trim().isEmpty()) {
            user.setRetrieveCode(generateUniqueRetrieveCode());
            userRepository.save(user);
        }

        String jsonBody = "{\"email\":\"" + escapeJson(user.getEmail()) + "\",\"code\":\"" + escapeJson(user.getRetrieveCode()) + "\"}";

        List<String> serviceUrls = new java.util.ArrayList<>();
        if (emailServiceUrl != null && !emailServiceUrl.trim().isEmpty()) {
            serviceUrls.add(emailServiceUrl.trim());
        }
        if (emailServiceBackupUrl != null && !emailServiceBackupUrl.trim().isEmpty()) {
            String backup = emailServiceBackupUrl.trim();
            if (serviceUrls.isEmpty() || !backup.equals(serviceUrls.get(0))) {
                serviceUrls.add(backup);
            }
        }

        RuntimeException lastError = null;
        for (String serviceUrl : serviceUrls) {
            String endpoint = serviceUrl.endsWith("/")
                    ? serviceUrl + "send-recovery-code"
                    : serviceUrl + "/send-recovery-code";

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(10))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

            if (emailServiceApiKey != null && !emailServiceApiKey.trim().isEmpty()) {
                requestBuilder.header("X-API-Key", emailServiceApiKey.trim());
            }

            try {
                HttpResponse<String> response = HttpClient.newHttpClient()
                        .send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

                int status = response.statusCode();
                if (status >= 200 && status < 300) {
                    return;
                }
                if (status >= 400 && status < 500) {
                    throw new RuntimeException("Could not send recovery code");
                }
                lastError = new RuntimeException("Could not send recovery code");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                lastError = new RuntimeException("Could not send recovery code");
            } catch (Exception e) {
                lastError = new RuntimeException("Could not send recovery code");
            }
        }

        if (lastError != null) throw lastError;
        throw new RuntimeException("Could not send recovery code");
    }

    public void resetPassword(String email, String code, String newPassword) {
        if (email == null || email.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }
        if (code == null || code.trim().isEmpty()) {
            throw new RuntimeException("Recovery code is required");
        }
        if (newPassword == null || newPassword.trim().isEmpty()) {
            throw new RuntimeException("New password is required");
        }

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new RuntimeException("This account doesn't exist"));

        String storedCode = user.getRetrieveCode();
        if (storedCode == null || storedCode.trim().isEmpty()) {
            throw new RuntimeException("Recovery code is required");
        }

        if (!storedCode.trim().equals(code.trim())) {
            throw new RuntimeException("Recovery code does not match");
        }

        validatePassword(newPassword);
        user.setPassword(passwordEncoder.encode(newPassword));
        user.setRetrieveCode(null);
        userRepository.save(user);
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }

    private boolean isFaceMatch(String inputImageBase64, String storedImageBase64) {
        try {
            BufferedImage inputImg = decodeBase64ToImage(inputImageBase64);
            BufferedImage storedImg = decodeBase64ToImage(storedImageBase64);

            if (inputImg == null || storedImg == null) return false;

            // Resize to small size for comparison (e.g., 32x32)
            BufferedImage resizedInput = resizeImage(inputImg, 32, 32);
            BufferedImage resizedStored = resizeImage(storedImg, 32, 32);

            double difference = calculateImageDifference(resizedInput, resizedStored);
            
            // Threshold for similarity (0.0 means identical, higher means more different)
            // This is a heuristic value. 15% difference tolerance.
            return difference < 0.15; 
        } catch (Exception e) {
            e.printStackTrace();
            return false;
        }
    }

    private void validatePassword(String password) {
        if (password == null || password.length() < 8) {
            throw new RuntimeException("Password must be at least 8 characters long");
        }
        if (!password.matches(".*[A-Z].*")) {
            throw new RuntimeException("Password must contain at least one uppercase letter");
        }
        if (!password.matches(".*[0-9].*")) {
            throw new RuntimeException("Password must contain at least one number");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            throw new RuntimeException("Password must contain at least one special character");
        }
    }

    private String generateRetrieveCode() {
        int code = secureRandom.nextInt(1_000_000);
        return String.format("%06d", code);
    }

    private String generateUniqueRetrieveCode() {
        for (int attempt = 0; attempt < 20; attempt++) {
            String code = generateRetrieveCode();
            if (!userRepository.existsByRetrieveCode(code)) return code;
        }
        throw new RuntimeException("Could not generate retrieve code");
    }

    private BufferedImage decodeBase64ToImage(String base64String) throws IOException {
        String base64 = base64String;
        if (base64.contains(",")) {
            base64 = base64.split(",")[1];
        }
        byte[] imageBytes = Base64.getDecoder().decode(base64);
        return ImageIO.read(new ByteArrayInputStream(imageBytes));
    }

    private BufferedImage resizeImage(BufferedImage originalImage, int targetWidth, int targetHeight) {
        BufferedImage resizedImage = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D graphics2D = resizedImage.createGraphics();
        graphics2D.drawImage(originalImage, 0, 0, targetWidth, targetHeight, null);
        graphics2D.dispose();
        return resizedImage;
    }

    private double calculateImageDifference(BufferedImage img1, BufferedImage img2) {
        long diff = 0;
        for (int y = 0; y < img1.getHeight(); y++) {
            for (int x = 0; x < img1.getWidth(); x++) {
                int rgb1 = img1.getRGB(x, y);
                int rgb2 = img2.getRGB(x, y);
                
                int r1 = (rgb1 >> 16) & 0xff;
                int g1 = (rgb1 >> 8) & 0xff;
                int b1 = (rgb1) & 0xff;
                
                int r2 = (rgb2 >> 16) & 0xff;
                int g2 = (rgb2 >> 8) & 0xff;
                int b2 = (rgb2) & 0xff;
                
                diff += Math.abs(r1 - r2);
                diff += Math.abs(g1 - g2);
                diff += Math.abs(b1 - b2);
            }
        }
        
        long maxDiff = 3L * 255 * img1.getWidth() * img1.getHeight();
        return (double) diff / maxDiff;
    }

    public UserDTO createUser(User user) {
        // Fallback for existing controller method, though signup is preferred
        if (userRepository.findByEmail(user.getEmail()).isPresent()) {
            throw new RuntimeException("Email already in use");
        }
        user.setPassword(passwordEncoder.encode(user.getPassword()));
        if (user.getRetrieveCode() == null || user.getRetrieveCode().trim().isEmpty()) {
            user.setRetrieveCode(generateUniqueRetrieveCode());
        }
        User savedUser = userRepository.save(user);
        return mapToDTO(savedUser);
    }

    public List<UserDTO> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToDTO)
                .collect(Collectors.toList());
    }

    public UserDTO getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return mapToDTO(user);
    }

    private UserDTO mapToDTO(User user) {
        UserDTO dto = new UserDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getName());
        dto.setEmail(user.getEmail());
        if (user.getCompany() != null) {
            dto.setCompanyId(user.getCompany().getId());
            dto.setCompanyName(user.getCompany().getCompanyName());
        }
        return dto;
    }

    public void deleteUser(Long id) {
        if (!userRepository.existsById(id)) {
            throw new RuntimeException("User not found");
        }
        userRepository.deleteById(id);
    }
}
