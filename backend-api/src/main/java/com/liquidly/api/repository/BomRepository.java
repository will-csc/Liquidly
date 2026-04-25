package com.liquidly.api.repository;

import com.liquidly.api.model.Bom;
import com.liquidly.api.model.Company;
import com.liquidly.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// Data access layer for BOM entities.
public interface BomRepository extends JpaRepository<Bom, Long> {
    List<Bom> findByProject(Project project);
    List<Bom> findByProjectId(Long projectId);
    List<Bom> findByProjectIdAndCompanyId(Long projectId, Long companyId);
    List<Bom> findByCompany(Company company);
    List<Bom> findByCompanyId(Long companyId);
    List<Bom> findByCompanyIdAndProjectId(Long companyId, Long projectId);
    Optional<Bom> findByIdAndCompanyId(Long id, Long companyId);
    void deleteByCompanyId(Long companyId);
}
