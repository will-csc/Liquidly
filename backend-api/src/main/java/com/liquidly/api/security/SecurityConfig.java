package com.liquidly.api.security;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

import java.util.List;
import java.util.stream.Collectors;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;
    private final List<String> allowedOriginPatterns;

    public SecurityConfig(
            JwtFilter jwtFilter,
            @Value("${app.security.cors.allowed-origin-patterns:http://localhost:5173}") String allowedOrigins
    ) {
        this.jwtFilter = jwtFilter;
        this.allowedOriginPatterns = List.of(allowedOrigins.split(","))
                .stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .collect(Collectors.toList());
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {

        // Configure HTTP security for a stateless API protected by JWT.
        http
                // Disable CSRF for APIs (no server-side sessions / browser form posts).
                .csrf(csrf -> csrf.disable())
                // Enable CORS so frontends can call the API from different origins.
                .cors(Customizer.withDefaults())
                .authorizeHttpRequests(auth -> auth
                        // Allow CORS preflight requests.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Allow unauthenticated access to auth and recovery endpoints.
                        .requestMatchers(
                                "/api/users/login",
                                "/api/users/login-face",
                                "/api/users/signup",
                                "/api/users/exists",
                                "/api/users/recovery/send-code",
                                "/api/users/recovery/reset-password"
                        ).permitAll()
                        // Require authentication for all other endpoints.
                        .anyRequest().authenticated()
                )
                // Validate JWTs before Spring Security's username/password authentication filter.
                .addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOriginPatterns(allowedOriginPatterns.isEmpty() ? List.of("http://localhost:5173") : allowedOriginPatterns);
        config.setAllowCredentials(false);
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("Authorization", "Content-Type", "Accept", "Origin", "Accept-Language"));
        config.setExposedHeaders(List.of("Authorization", "Content-Disposition"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
