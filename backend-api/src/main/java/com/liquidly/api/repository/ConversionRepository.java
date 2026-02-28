package com.liquidly.api.repository;

import com.liquidly.api.model.Company;
import com.liquidly.api.model.Conversion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ConversionRepository extends JpaRepository<Conversion, Long> {
    List<Conversion> findByCompany(Company company);
    List<Conversion> findByCompanyId(Long companyId);
    Optional<Conversion> findByItemCodeAndCompany(String itemCode, Company company);
    Optional<Conversion> findByItemCodeAndCompanyId(String itemCode, Long companyId);
}
