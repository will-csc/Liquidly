package com.liquidly.api.security;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@Configuration
public class SecurityConfig {

    private final JwtFilter jwtFilter;

    public SecurityConfig(JwtFilter jwtFilter) {
        this.jwtFilter = jwtFilter;
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
    public BCryptPasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }
}
