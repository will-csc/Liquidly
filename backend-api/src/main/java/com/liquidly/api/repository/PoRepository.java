package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Po;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Set;

@Repository
// Data access layer for purchase order (PO) entities.
public interface PoRepository extends JpaRepository<Po, Long> {
    List<Po> findByCompany(Company company);
    List<Po> findByCompanyId(Long companyId);
    List<Po> findByInvoiceNumber(String invoiceNumber);
    List<Po> findByCompanyIdAndInvoiceNumberIn(Long companyId, Set<String> invoiceNumbers);
    void deleteByCompanyId(Long companyId);
}
