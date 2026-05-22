package com.liquidly.api.service;

import com.liquidly.api.model.User;
import com.liquidly.api.repository.BomRepository;
import com.liquidly.api.repository.CompanyRepository;
import com.liquidly.api.repository.ConversionRepository;
import com.liquidly.api.repository.InvoiceRepository;
import com.liquidly.api.repository.LiquidationResultRepository;
import com.liquidly.api.repository.PoRepository;
import com.liquidly.api.repository.ProjectRepository;
import com.liquidly.api.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private CompanyRepository companyRepository;

    @Mock
    private BomRepository bomRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PoRepository poRepository;

    @Mock
    private ConversionRepository conversionRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private LiquidationResultRepository liquidationResultRepository;

    @Mock
    private UserSessionService userSessionService;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private UserService userService;

    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(userService, "passwordEncoder", passwordEncoder);
    }

    @Test
    void shouldReturnOnlyAuthenticatedUserInUserList() {
        User authenticatedUser = new User();
        authenticatedUser.setId(7L);
        authenticatedUser.setName("William");
        authenticatedUser.setEmail("william@example.com");

        when(authenticatedUserService.getRequiredAuthenticatedUser()).thenReturn(authenticatedUser);

        var users = userService.getAllUsers();

        assertEquals(1, users.size());
        assertEquals(7L, users.get(0).getId());
        assertEquals("william@example.com", users.get(0).getEmail());
        verify(userRepository, never()).findAll();
    }

    @Test
    void shouldForbidAccessToAnotherUserProfile() {
        User authenticatedUser = new User();
        authenticatedUser.setId(7L);
        authenticatedUser.setName("William");
        authenticatedUser.setEmail("william@example.com");

        when(authenticatedUserService.getRequiredAuthenticatedUser()).thenReturn(authenticatedUser);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> userService.getUserById(8L));

        assertEquals(403, ex.getStatusCode().value());
        assertEquals("You can only access your own user", ex.getReason());
    }

    @Test
    void shouldClearRecoveryStateAfterSuccessfulPasswordReset() {
        User user = new User();
        user.setId(3L);
        user.setEmail("user@example.com");
        user.setPassword(passwordEncoder.encode("SenhaAntiga1!"));
        user.setRetrieveCode(passwordEncoder.encode("123456"));
        user.setRetrieveCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        user.setRetrieveCodeAttempts(1);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        userService.resetPassword("user@example.com", "123456", "NovaSenha1!");

        assertTrue(passwordEncoder.matches("NovaSenha1!", user.getPassword()));
        assertNull(user.getRetrieveCode());
        assertNull(user.getRetrieveCodeExpiresAt());
        assertNull(user.getRetrieveCodeAttempts());
        verify(userRepository).save(user);
    }

    @Test
    void shouldIncrementRecoveryAttemptsWhenCodeDoesNotMatch() {
        User user = new User();
        user.setId(4L);
        user.setEmail("user@example.com");
        user.setRetrieveCode(passwordEncoder.encode("123456"));
        user.setRetrieveCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        user.setRetrieveCodeAttempts(1);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.resetPassword("user@example.com", "654321", "NovaSenha1!"));

        assertEquals("Recovery code does not match", ex.getMessage());
        assertEquals(2, user.getRetrieveCodeAttempts());
        assertNotNull(user.getRetrieveCode());
        verify(userRepository).save(user);
    }

    @Test
    void shouldInvalidateRecoveryStateAfterTooManyAttempts() {
        User user = new User();
        user.setId(5L);
        user.setEmail("user@example.com");
        user.setRetrieveCode(passwordEncoder.encode("123456"));
        user.setRetrieveCodeExpiresAt(Instant.now().plus(10, ChronoUnit.MINUTES));
        user.setRetrieveCodeAttempts(5);

        when(userRepository.findByEmail("user@example.com")).thenReturn(Optional.of(user));

        RuntimeException ex = assertThrows(RuntimeException.class,
                () -> userService.resetPassword("user@example.com", "123456", "NovaSenha1!"));

        assertEquals("Recovery code has exceeded the maximum number of attempts", ex.getMessage());
        assertNull(user.getRetrieveCode());
        assertNull(user.getRetrieveCodeExpiresAt());
        assertNull(user.getRetrieveCodeAttempts());
        verify(userRepository).save(user);
    }

    @Test
    void shouldRejectFaceLoginWhenDisabled() {
        ReflectionTestUtils.setField(userService, "faceLoginEnabled", false);

        var request = new com.liquidly.api.dto.FaceLoginRequest();
        request.setFaceImage("data:image/jpeg;base64,AAAA");

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> userService.loginFace(request));

        assertEquals(403, ex.getStatusCode().value());
        assertEquals("Face login is disabled", ex.getReason());
    }
}
