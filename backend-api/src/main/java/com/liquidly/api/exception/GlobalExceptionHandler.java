package com.liquidly.api.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ControllerAdvice;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.HashMap;
import java.util.Map;

@ControllerAdvice
public class GlobalExceptionHandler {

    private static final Logger logger = LoggerFactory.getLogger(GlobalExceptionHandler.class);

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, String>> handleRuntimeException(RuntimeException ex) {
        Map<String, String> response = new HashMap<>();
        logger.error("RuntimeException", ex);
        
        HttpStatus status = HttpStatus.INTERNAL_SERVER_ERROR;
        String msg = ex.getMessage() == null ? "" : ex.getMessage();
        String responseMessage = msg;
        
        // Mantém as mensagens específicas solicitadas anteriormente
        if (msg.contains("Could not send recovery code")) {
            status = HttpStatus.BAD_GATEWAY; // 502
            responseMessage = "Could not send the recovery code. Please try again.";
        } else if (msg.contains("Could not send report")) {
            status = HttpStatus.BAD_GATEWAY; // 502
            responseMessage = "Não foi possível enviar o relatório por email. Tente novamente.";
        } else if (msg.contains("Recovery code")) {
            status = HttpStatus.BAD_REQUEST; // 400
        } else if (msg.contains("doesn't exist") || msg.contains("not found")) {
            status = HttpStatus.NOT_FOUND; // 404
        } else if (msg.contains("wrong") || msg.contains("Invalid") || msg.contains("Face not recognized")) {
            status = HttpStatus.UNAUTHORIZED; // 401
        } else if (msg.contains("already in use") || msg.contains("required") || msg.contains("already registered") || msg.contains("Password must")) {
            status = HttpStatus.BAD_REQUEST; // 400
        } else {
            // Para todos os outros erros não tratados (erros de backend/sistema)
            responseMessage = "We are having communications problems, please wait some minutes. If the problem persists, send a email to liquidly@gmail.com";
        }
        
        response.put("message", responseMessage);
        return ResponseEntity.status(status).body(response);
    }
    
    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, String>> handleException(Exception ex) {
        Map<String, String> response = new HashMap<>();
        logger.error("Exception", ex);
        response.put("message", "We are having communications problems, please wait some minutes. If the problem persists, send a email to liquidly@gmail.com");
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
    }
}
