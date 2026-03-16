package com.liquidly.api.security;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;

@Component
public class JwtFilter extends OncePerRequestFilter {

    private static final Logger logger = LoggerFactory.getLogger(JwtFilter.class);
    private final JwtService jwtService;

    public JwtFilter(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        String userBefore = getAuthenticatedUser();
        String method = request.getMethod();
        String path = getPathWithQuery(request);

        String header = request.getHeader("Authorization");

        if (header != null && header.startsWith("Bearer ")) {

            String token = header.substring(7);

            if (jwtService.isTokenValid(token)) {

                String email = jwtService.extractEmail(token);

                UsernamePasswordAuthenticationToken auth =
                        new UsernamePasswordAuthenticationToken(
                                email,
                                null,
                                Collections.emptyList()
                        );

                SecurityContextHolder.getContext().setAuthentication(auth);
            }
        }

        try {
            filterChain.doFilter(request, response);
        } catch (Exception e) {
            long ms = System.currentTimeMillis() - start;
            String user = firstNonBlank(getAuthenticatedUser(), userBefore, "anon");
            logger.warn("Usuario {} falhou na rota {} {} (ms={}, erro={})", user, method, path, ms, getRootCauseMessage(e));
            throw e;
        } finally {
            int status = response.getStatus();
            if (!"OPTIONS".equalsIgnoreCase(method)) {
                long ms = System.currentTimeMillis() - start;
                String user = firstNonBlank(getAuthenticatedUser(), userBefore, "anon");
                if (status < 400) {
                    logger.info("Usuario {} passou pela rota {} {} (status={}, ms={})", user, method, path, status, ms);
                } else {
                    logger.warn("Usuario {} passou pela rota {} {} (status={}, ms={})", user, method, path, status, ms);
                }
            }
        }
    }

    private String getAuthenticatedUser() {
        var auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.isAuthenticated()) {
            String name = auth.getName();
            if (name != null && !name.isBlank() && !"anonymousUser".equalsIgnoreCase(name)) {
                return name;
            }
        }
        return "";
    }

    private String getPathWithQuery(HttpServletRequest request) {
        String qs = request.getQueryString();
        return qs == null || qs.isBlank() ? request.getRequestURI() : (request.getRequestURI() + "?" + qs);
    }

    private String firstNonBlank(String... values) {
        if (values == null) return "";
        for (String value : values) {
            if (value != null && !value.isBlank()) return value;
        }
        return "";
    }

    private String getRootCauseMessage(Throwable t) {
        Throwable cur = t;
        while (cur.getCause() != null && cur.getCause() != cur) {
            cur = cur.getCause();
        }
        String message = cur.getMessage();
        if (message != null && !message.isBlank()) return message;
        return cur.getClass().getSimpleName();
    }
}
