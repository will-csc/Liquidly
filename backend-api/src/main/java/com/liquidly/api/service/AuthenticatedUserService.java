package com.liquidly.api.service;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.User;
import com.liquidly.api.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthenticatedUserService {

    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getRequiredAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found");
        }

        String email = authentication.getName().trim();
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found"));
    }

    public Company getRequiredCompany() {
        User user = getRequiredAuthenticatedUser();
        Company company = user.getCompany();
        if (company == null || company.getId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated user does not have a company");
        }
        return company;
    }

    public Long getRequiredCompanyId() {
        return getRequiredCompany().getId();
    }

    public Long validateAndResolveCompanyId(Long requestedCompanyId) {
        Long authenticatedCompanyId = getRequiredCompanyId();
        if (requestedCompanyId != null && !authenticatedCompanyId.equals(requestedCompanyId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access data from another company");
        }
        return authenticatedCompanyId;
    }
}
