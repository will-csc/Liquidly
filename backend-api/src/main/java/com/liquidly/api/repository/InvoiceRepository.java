package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Invoice;
import com.liquidly.api.model.Project;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
// Data access layer for invoice entities.
public interface InvoiceRepository extends JpaRepository<Invoice, Long> {
    List<Invoice> findByProject(Project project);
    List<Invoice> findByProjectId(Long projectId);
    List<Invoice> findByCompany(Company company);
    List<Invoice> findByCompanyId(Long companyId);
    List<Invoice> findByCompanyIdAndProjectId(Long companyId, Long projectId);
    Optional<Invoice> findByIdAndCompanyId(Long id, Long companyId);
    Optional<Invoice> findByInvoiceNumberAndCompany(String invoiceNumber, Company company);
    Optional<Invoice> findByInvoiceNumberAndCompanyId(String invoiceNumber, Long companyId);
    void deleteByCompanyId(Long companyId);
}
