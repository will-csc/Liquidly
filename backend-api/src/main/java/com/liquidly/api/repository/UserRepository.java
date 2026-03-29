package com.liquidly.api.repository;

import com.liquidly.api.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
// Data access layer for User entities.
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    boolean existsByRetrieveCode(String retrieveCode);
    long countByCompanyId(Long companyId);
}
