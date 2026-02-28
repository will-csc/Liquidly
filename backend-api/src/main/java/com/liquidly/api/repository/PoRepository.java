package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Po;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PoRepository extends JpaRepository<Po, Long> {
    List<Po> findByCompany(Company company);
    List<Po> findByCompanyId(Long companyId);
    List<Po> findByInvoiceNumber(String invoiceNumber);
}
