package com.liquidly.api.model;

import jakarta.persistence.Basic;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.Instant;

@Entity
@Table(name = "report_jobs")
@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportJob {

    @Id
    @Column(name = "job_id", nullable = false, length = 80)
    private String jobId;

    @Column(name = "company_id", nullable = false)
    private Long companyId;

    @Column(name = "project_id", nullable = false)
    private Long projectId;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "progress", nullable = false)
    private int progress;

    @Column(name = "stage", nullable = false, length = 120)
    private String stage;

    @Column(name = "message", nullable = false, length = 500)
    private String message;

    @Column(name = "error_message", length = 500)
    private String errorMessage;

    @Column(name = "file_name", length = 255)
    private String fileName;

    @Column(name = "content_type", length = 150)
    private String contentType;

    @Lob
    @Basic(fetch = FetchType.LAZY)
    @Column(name = "file_content")
    private byte[] fileContent;

    @Column(name = "total_steps", nullable = false)
    private int totalSteps;

    @Column(name = "completed_steps", nullable = false)
    private int completedSteps;

    @Column(name = "remaining_steps", nullable = false)
    private int remainingSteps;

    @Column(name = "started_at", nullable = false)
    private Instant startedAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "finished_at")
    private Instant finishedAt;

    @PrePersist
    protected void onCreate() {
        Instant now = Instant.now();
        if (startedAt == null) startedAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = Instant.now();
    }
}
