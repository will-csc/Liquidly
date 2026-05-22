package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Po;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.Set;

@Repository
// Data access layer for purchase order (PO) entities.
public interface PoRepository extends JpaRepository<Po, Long> {
    List<Po> findByCompany(Company company);
    List<Po> findByCompanyId(Long companyId);
    Optional<Po> findByIdAndCompanyId(Long id, Long companyId);
    List<Po> findByPoNumberAndCompanyId(String poNumber, Long companyId);
    void deleteByCompanyId(Long companyId);

    @Modifying
    @Query(value = "UPDATE pos SET remaining_qntd = qntd_po WHERE company_id = :companyId", nativeQuery = true)
    int resetRemainingQuantityByCompanyId(Long companyId);
}
