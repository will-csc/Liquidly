package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
// Data access layer for Project entities.
public interface ProjectRepository extends JpaRepository<Project, Long> {
    List<Project> findByCompany(Company company);
    List<Project> findByCompanyId(Long companyId);
    boolean existsByNameIgnoreCaseAndCompanyId(String name, Long companyId);
}
