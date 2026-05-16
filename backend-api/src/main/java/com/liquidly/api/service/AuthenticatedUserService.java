package com.liquidly.api.service;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.User;
import com.liquidly.api.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

@Service
public class AuthenticatedUserService {

    private static final Logger logger = LoggerFactory.getLogger(AuthenticatedUserService.class);
    private final UserRepository userRepository;

    public AuthenticatedUserService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public User getRequiredAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            logger.warn("Nao foi possivel resolver o usuario autenticado: contexto de seguranca vazio");
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found");
        }

        String email = authentication.getName().trim();
        logger.info("Resolvendo usuario autenticado para email={}", email);
        return userRepository.findByEmail(email)
                .orElseThrow(() -> {
                    logger.warn("Usuario autenticado nao encontrado no banco: email={}", email);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authenticated user not found");
                });
    }

    public Company getRequiredCompany() {
        User user = getRequiredAuthenticatedUser();
        Company company = user.getCompany();
        if (company == null || company.getId() == null) {
            logger.warn("Usuario autenticado sem empresa vinculada: email={}, userId={}", user.getEmail(), user.getId());
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Authenticated user does not have a company");
        }
        logger.info("Empresa autenticada resolvida: email={}, companyId={}, companyName={}",
                user.getEmail(), company.getId(), company.getCompanyName());
        return company;
    }

    public Long getRequiredCompanyId() {
        return getRequiredCompany().getId();
    }

    public Long validateAndResolveCompanyId(Long requestedCompanyId) {
        Long authenticatedCompanyId = getRequiredCompanyId();
        if (requestedCompanyId != null && !authenticatedCompanyId.equals(requestedCompanyId)) {
            logger.warn("Tentativa de acesso a company diferente da autenticada: requestedCompanyId={}, authenticatedCompanyId={}",
                    requestedCompanyId, authenticatedCompanyId);
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You cannot access data from another company");
        }
        logger.info("Company validada para a requisicao: requestedCompanyId={}, resolvedCompanyId={}",
                requestedCompanyId, authenticatedCompanyId);
        return authenticatedCompanyId;
    }
}
