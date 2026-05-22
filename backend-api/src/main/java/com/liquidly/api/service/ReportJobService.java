package com.liquidly.api.service;

import com.liquidly.api.dto.ReportJobStartResponse;
import com.liquidly.api.dto.ReportJobStatusResponse;
import com.liquidly.api.model.ReportJob;
import com.liquidly.api.repository.ReportJobRepository;
import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.context.event.EventListener;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class ReportJobService {
    private static final List<String> INCOMPLETE_STATUSES = List.of("queued", "running");
    private final ReportJobRepository reportJobRepository;

    public ReportJobService(ReportJobRepository reportJobRepository) {
        this.reportJobRepository = reportJobRepository;
    }

    @Transactional
    public ReportJobStartResponse createJob(Long companyId, Long projectId) {
        Instant now = Instant.now();
        ReportJob state = new ReportJob();
        state.setJobId(UUID.randomUUID().toString());
        state.setCompanyId(companyId);
        state.setProjectId(projectId);
        state.setStatus("queued");
        state.setProgress(0);
        state.setStage("Fila");
        state.setMessage("Relatório entrou na fila de processamento.");
        state.setTotalSteps(100);
        state.setCompletedSteps(0);
        state.setRemainingSteps(100);
        state.setStartedAt(now);
        state.setUpdatedAt(now);
        reportJobRepository.save(state);
        return new ReportJobStartResponse(state.getJobId(), state.getStatus(), state.getProgress(), state.getMessage());
    }

    @Transactional(readOnly = true)
    public ReportJobStatusResponse getJob(String jobId, Long companyId) {
        return toResponse(requireJob(jobId, companyId));
    }

    @Transactional
    public void update(String jobId, int progress, String status, String stage, String message) {
        ReportJob state = requireJob(jobId, null);
        state.setStatus(status);
        state.setProgress(clamp(progress));
        state.setStage(stage);
        state.setMessage(message);
        state.setCompletedSteps(state.getProgress());
        state.setRemainingSteps(Math.max(0, state.getTotalSteps() - state.getCompletedSteps()));
        state.setUpdatedAt(Instant.now());
        reportJobRepository.save(state);
    }

    @Transactional
    public void complete(String jobId, String message) {
        complete(jobId, message, null, null, null);
    }

    @Transactional
    public void complete(String jobId, String message, byte[] fileContent, String fileName, String contentType) {
        ReportJob state = requireJob(jobId, null);
        Instant now = Instant.now();
        state.setStatus("completed");
        state.setProgress(100);
        state.setStage("Concluido");
        state.setMessage(message);
        state.setCompletedSteps(100);
        state.setRemainingSteps(0);
        state.setUpdatedAt(now);
        state.setFinishedAt(now);
        state.setErrorMessage(null);
        state.setFileContent(fileContent == null ? null : fileContent.clone());
        state.setFileName(fileName);
        state.setContentType(contentType);
        reportJobRepository.save(state);
    }

    @Transactional
    public void fail(String jobId, String message) {
        ReportJob state = requireJob(jobId, null);
        applyFailure(state, message);
        reportJobRepository.save(state);
    }

    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void markInterruptedJobsAsFailed() {
        List<ReportJob> interruptedJobs = reportJobRepository.findByStatusIn(INCOMPLETE_STATUSES);
        for (ReportJob job : interruptedJobs) {
            applyFailure(job, "O processamento foi interrompido porque o backend reiniciou antes da conclusão.");
        }
        if (!interruptedJobs.isEmpty()) {
            reportJobRepository.saveAll(interruptedJobs);
        }
    }

    private ReportJob requireJob(String jobId, Long companyId) {
        if (jobId == null || jobId.isBlank()) {
            throw new RuntimeException("Report job not found");
        }
        if (companyId != null) {
            return reportJobRepository.findByJobIdAndCompanyId(jobId, companyId)
                    .orElseThrow(() -> new RuntimeException("Report job not found"));
        }
        return reportJobRepository.findById(jobId)
                .orElseThrow(() -> new RuntimeException("Report job not found"));
    }

    private int clamp(int progress) {
        return Math.max(0, Math.min(100, progress));
    }

    private ReportJobStatusResponse toResponse(ReportJob state) {
        ReportJobStatusResponse response = new ReportJobStatusResponse();
        response.setJobId(state.getJobId());
        response.setCompanyId(state.getCompanyId());
        response.setProjectId(state.getProjectId());
        response.setStatus(state.getStatus());
        response.setProgress(state.getProgress());
        response.setStage(state.getStage());
        response.setMessage(state.getMessage());
        response.setErrorMessage(state.getErrorMessage());
        response.setDownloadReady(state.getFileContent() != null && state.getFileContent().length > 0);
        response.setFileName(state.getFileName());
        response.setTotalSteps(state.getTotalSteps());
        response.setCompletedSteps(state.getCompletedSteps());
        response.setRemainingSteps(state.getRemainingSteps());
        response.setStartedAt(state.getStartedAt());
        response.setUpdatedAt(state.getUpdatedAt());
        response.setFinishedAt(state.getFinishedAt());
        return response;
    }

    @Transactional(readOnly = true)
    public ReportFile getReportFile(String jobId, Long companyId) {
        ReportJob state = requireJob(jobId, companyId);
        if (state.getFileContent() == null || state.getFileContent().length == 0) {
            throw new RuntimeException("Report file not ready");
        }
        return new ReportFile(
                state.getFileContent().clone(),
                state.getFileName() == null || state.getFileName().isBlank() ? "liquidly_report.xlsx" : state.getFileName(),
                state.getContentType() == null || state.getContentType().isBlank()
                        ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                        : state.getContentType()
        );
    }

    private void applyFailure(ReportJob state, String message) {
        Instant now = Instant.now();
        state.setStatus("failed");
        state.setStage("Falha");
        state.setErrorMessage(message);
        state.setMessage("O relatório não pôde ser concluído.");
        state.setUpdatedAt(now);
        state.setFinishedAt(now);
    }

    public record ReportFile(byte[] content, String fileName, String contentType) {
    }
}
