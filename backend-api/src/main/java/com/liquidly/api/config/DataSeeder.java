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
            // Seed demo data at startup (company only).
            String companyName = "Liquidly Demo Corp";
            companyRepository.findByCompanyName(companyName)
                    .orElseGet(() -> {
                        Company newCompany = new Company();
                        newCompany.setCompanyName(companyName);
                        return companyRepository.save(newCompany);
                    });
        };
    }
}
