package com.liquidly.api.config;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.User;
import com.liquidly.api.repository.CompanyRepository;
import com.liquidly.api.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

@Configuration
public class DataSeeder {

    @Bean
    public CommandLineRunner initData(UserRepository userRepository, CompanyRepository companyRepository, PasswordEncoder passwordEncoder) {
        return args -> {
            // Seed demo data at startup (a default company and a couple of default users).

            // Create a default company if it does not exist.
            String companyName = "Liquidly Demo Corp";
            Company company = companyRepository.findByCompanyName(companyName)
                    .orElseGet(() -> {
                        Company newCompany = new Company();
                        newCompany.setCompanyName(companyName);
                        return companyRepository.save(newCompany);
                    });

            // Create a default admin user if it does not exist.
            String userEmail = "admin@liquidly.com";
            if (userRepository.findByEmail(userEmail).isEmpty()) {
                User user = new User();
                user.setName("Admin User");
                user.setEmail(userEmail);
                user.setPassword(passwordEncoder.encode("admin123")); // In real app, hash this!
                user.setCompany(company);
                userRepository.save(user);
                System.out.println(">>> Default User Created: " + userEmail + " / admin123");
            }
            
            // Create an additional test user if it does not exist.
            String testEmail = "user@liquidly.com";
            if (userRepository.findByEmail(testEmail).isEmpty()) {
                User user = new User();
                user.setName("Test User");
                user.setEmail(testEmail);
                user.setPassword(passwordEncoder.encode("user123"));
                user.setCompany(company);
                userRepository.save(user);
                System.out.println(">>> Test User Created: " + testEmail + " / user123");
            }
        };
    }
}
