package com.liquidly.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.context.MessageSource;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;
import java.util.Locale;
import jakarta.servlet.http.HttpServletRequest;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);
    private final MessageSource messageSource;

    public GlobalExceptionHandler(MessageSource messageSource) {
        this.messageSource = messageSource;
    }

    // Resolve the root cause message so logs contain the most relevant error.
    private String getRootCauseMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        String message = cur.getMessage();
        if (message != null && !message.isBlank()) return message;
        return cur.getClass().getSimpleName();
    }

    @ExceptionHandler(RuntimeException.class)
    // Convert runtime errors into a consistent JSON response and map known messages to HTTP status codes.
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex, HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        logger.error("Request failed: {}", getRootCauseMessage(ex));
        
        Locale locale = resolveLocale(request);
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String msg = ex.getMessage() == null ? "" : ex.getMessage();
        String code = "INTERNAL_ERROR";
        String messageKey = "error.internal";
        
        if (msg.contains("Could not send recovery code")) {
            status = HttpStatus.BAD_GATEWAY;
            code = "RECOVERY_CODE_SEND_FAILED";
            messageKey = "error.recovery.send_code_failed";
        } else if (msg.contains("Could not send report")) {
            status = HttpStatus.BAD_GATEWAY;
            code = "REPORT_SEND_FAILED";
            messageKey = "error.report.send_failed";
        } else if (msg.contains("Recovery code is required")) {
            status = HttpStatus.BAD_REQUEST;
            code = "RECOVERY_CODE_REQUIRED";
            messageKey = "error.recovery.code_required";
        } else if (msg.contains("New password is required")) {
            status = HttpStatus.BAD_REQUEST;
            code = "NEW_PASSWORD_REQUIRED";
            messageKey = "error.recovery.new_password_required";
        } else if (msg.contains("Recovery code")) {
            status = HttpStatus.BAD_REQUEST;
            code = "RECOVERY_CODE_INVALID";
            messageKey = "error.recovery.invalid_code";
        } else if (msg.contains("This account doesn't exist")) {
            status = HttpStatus.NOT_FOUND;
            code = "ACCOUNT_NOT_FOUND";
            messageKey = "error.auth.account_not_found";
        } else if (msg.contains("Face not recognized")) {
            status = HttpStatus.UNAUTHORIZED;
            code = "FACE_NOT_RECOGNIZED";
            messageKey = "error.auth.face_not_recognized";
        } else if (msg.contains("The password is wrong")) {
            status = HttpStatus.UNAUTHORIZED;
            code = "INVALID_CREDENTIALS";
            messageKey = "error.auth.invalid_credentials";
        } else if (msg.contains("Email already in use")) {
            status = HttpStatus.BAD_REQUEST;
            code = "EMAIL_IN_USE";
            messageKey = "error.signup.email_in_use";
        } else if (msg.contains("This company is already registered")) {
            status = HttpStatus.BAD_REQUEST;
            code = "COMPANY_ALREADY_REGISTERED";
            messageKey = "error.signup.company_exists";
        } else if (msg.contains("Email is required") || msg.contains("Password is required") || msg.contains("Face image is required")) {
            status = HttpStatus.BAD_REQUEST;
            code = "REQUIRED_FIELD";
            messageKey = "error.validation.required_field";
        } else if (msg.contains("Password must be at least 8 characters long")) {
            status = HttpStatus.BAD_REQUEST;
            code = "PASSWORD_MIN_LENGTH";
            messageKey = "error.validation.password.min_length";
        } else if (msg.contains("Password must contain at least one uppercase letter")) {
            status = HttpStatus.BAD_REQUEST;
            code = "PASSWORD_UPPERCASE_REQUIRED";
            messageKey = "error.validation.password.uppercase";
        } else if (msg.contains("Password must contain at least one number")) {
            status = HttpStatus.BAD_REQUEST;
            code = "PASSWORD_NUMBER_REQUIRED";
            messageKey = "error.validation.password.number";
        } else if (msg.contains("Password must contain at least one special character")) {
            status = HttpStatus.BAD_REQUEST;
            code = "PASSWORD_SPECIAL_REQUIRED";
            messageKey = "error.validation.password.special";
        } else if (msg.contains("not found")) {
            status = HttpStatus.NOT_FOUND;
            code = "NOT_FOUND";
            messageKey = "error.internal";
        } else if (msg.contains("wrong") || msg.contains("Invalid")) {
            status = HttpStatus.UNAUTHORIZED;
            code = "UNAUTHORIZED";
            messageKey = "error.auth.invalid_credentials";
        } else if (msg.contains("required") || msg.contains("already registered") || msg.contains("already in use") || msg.contains("Password must")) {
            status = HttpStatus.BAD_REQUEST;
            code = "BAD_REQUEST";
            messageKey = "error.internal";
        }
        
        response.put("code", code);
        response.put("message", messageSource.getMessage(messageKey, null, messageKey, locale));
        return ResponseEntity.status(status).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    // Fallback handler for unexpected checked exceptions.
    public ResponseEntity<Map<String, String>> handleException(Exception ex, HttpServletRequest request) {
        Map<String, String> response = new HashMap<>();
        logger.error("Request failed: {}", getRootCauseMessage(ex));
        Locale locale = resolveLocale(request);
        response.put("code", "INTERNAL_ERROR");
        response.put("message", messageSource.getMessage("error.internal", null, "error.internal", locale));
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }

    private Locale resolveLocale(HttpServletRequest request) {
        if (request == null) return Locale.ENGLISH;
        String header = request.getHeader("Accept-Language");
        if (header == null || header.isBlank()) return Locale.ENGLISH;
        String tag = header.split(",")[0].trim();
        if (tag.isBlank()) return Locale.ENGLISH;
        return Locale.forLanguageTag(tag);
    }
}
