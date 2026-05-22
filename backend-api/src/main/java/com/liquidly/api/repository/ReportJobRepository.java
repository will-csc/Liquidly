package com.liquidly.api.repository;

import com.liquidly.api.model.ReportJob;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface ReportJobRepository extends JpaRepository<ReportJob, String> {
    Optional<ReportJob> findByJobIdAndCompanyId(String jobId, Long companyId);
    List<ReportJob> findByStatusIn(Collection<String> statuses);
}
