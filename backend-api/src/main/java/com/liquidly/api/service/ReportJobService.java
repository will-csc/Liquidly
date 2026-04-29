package com.liquidly.api.service;

import com.liquidly.api.dto.ReportJobStartResponse;
import com.liquidly.api.dto.ReportJobStatusResponse;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class ReportJobService {
    private final Map<String, JobState> jobs = new ConcurrentHashMap<>();

    public ReportJobStartResponse createJob(Long companyId, Long projectId) {
        JobState state = new JobState();
        state.jobId = UUID.randomUUID().toString();
        state.companyId = companyId;
        state.projectId = projectId;
        state.status = "queued";
        state.progress = 0;
        state.stage = "Fila";
        state.message = "Relatório entrou na fila de processamento.";
        state.totalSteps = 100;
        state.completedSteps = 0;
        state.remainingSteps = 100;
        state.startedAt = Instant.now();
        state.updatedAt = state.startedAt;
        jobs.put(state.jobId, state);
        return new ReportJobStartResponse(state.jobId, state.status, state.progress, state.message);
    }

    public ReportJobStatusResponse getJob(String jobId, Long companyId) {
        JobState state = jobs.get(jobId);
        if (state == null) {
            throw new RuntimeException("Report job not found");
        }
        if (companyId != null && state.companyId != null && !state.companyId.equals(companyId)) {
            throw new RuntimeException("Report job not found");
        }
        synchronized (state) {
            return toResponse(state);
        }
    }

    public void update(String jobId, int progress, String status, String stage, String message) {
        JobState state = requireJob(jobId);
        synchronized (state) {
            state.status = status;
            state.progress = clamp(progress);
            state.stage = stage;
            state.message = message;
            state.completedSteps = state.progress;
            state.remainingSteps = Math.max(0, state.totalSteps - state.completedSteps);
            state.updatedAt = Instant.now();
        }
    }

    public void complete(String jobId, String message) {
        JobState state = requireJob(jobId);
        synchronized (state) {
            state.status = "completed";
            state.progress = 100;
            state.stage = "Concluido";
            state.message = message;
            state.completedSteps = 100;
            state.remainingSteps = 0;
            state.updatedAt = Instant.now();
            state.finishedAt = state.updatedAt;
            state.errorMessage = null;
        }
    }

    public void fail(String jobId, String message) {
        JobState state = requireJob(jobId);
        synchronized (state) {
            state.status = "failed";
            state.stage = "Falha";
            state.errorMessage = message;
            state.message = "O relatório não pôde ser concluído.";
            state.updatedAt = Instant.now();
            state.finishedAt = state.updatedAt;
        }
    }

    private JobState requireJob(String jobId) {
        JobState state = jobs.get(jobId);
        if (state == null) {
            throw new RuntimeException("Report job not found");
        }
        return state;
    }

    private int clamp(int progress) {
        return Math.max(0, Math.min(100, progress));
    }

    private ReportJobStatusResponse toResponse(JobState state) {
        ReportJobStatusResponse response = new ReportJobStatusResponse();
        response.setJobId(state.jobId);
        response.setCompanyId(state.companyId);
        response.setProjectId(state.projectId);
        response.setStatus(state.status);
        response.setProgress(state.progress);
        response.setStage(state.stage);
        response.setMessage(state.message);
        response.setErrorMessage(state.errorMessage);
        response.setTotalSteps(state.totalSteps);
        response.setCompletedSteps(state.completedSteps);
        response.setRemainingSteps(state.remainingSteps);
        response.setStartedAt(state.startedAt);
        response.setUpdatedAt(state.updatedAt);
        response.setFinishedAt(state.finishedAt);
        return response;
    }

    private static final class JobState {
        private String jobId;
        private Long companyId;
        private Long projectId;
        private String status;
        private int progress;
        private String stage;
        private String message;
        private String errorMessage;
        private int totalSteps;
        private int completedSteps;
        private int remainingSteps;
        private Instant startedAt;
        private Instant updatedAt;
        private Instant finishedAt;
    }
}
