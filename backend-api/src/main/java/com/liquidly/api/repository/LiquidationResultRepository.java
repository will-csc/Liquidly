package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// Data access layer for liquidation result entities.
public interface LiquidationResultRepository extends JpaRepository<LiquidationResult, Long> {
    List<LiquidationResult> findByProject(Project project);
    List<LiquidationResult> findByProjectId(Long projectId);
    List<LiquidationResult> findByProjectIdAndCompanyId(Long projectId, Long companyId);
    List<LiquidationResult> findByCompany(Company company);
    List<LiquidationResult> findByCompanyId(Long companyId);
    Optional<LiquidationResult> findByIdAndCompanyId(Long id, Long companyId);
    void deleteByCompanyIdAndProjectId(Long companyId, Long projectId);
    void deleteByCompanyId(Long companyId);
}
