package com.liquidly.api.service;

import com.liquidly.api.model.ReportJob;
import com.liquidly.api.repository.ReportJobRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReportJobServiceTest {

    @Mock
    private ReportJobRepository reportJobRepository;

    @InjectMocks
    private ReportJobService reportJobService;

    @Test
    void shouldPersistCompletedFileAndReturnItForDownload() {
        ReportJob job = new ReportJob();
        job.setJobId("job-1");
        job.setCompanyId(10L);
        job.setProjectId(20L);
        job.setStatus("running");
        job.setProgress(50);
        job.setTotalSteps(100);
        job.setCompletedSteps(50);
        job.setRemainingSteps(50);

        byte[] content = "excel-bytes".getBytes();

        when(reportJobRepository.findById("job-1")).thenReturn(Optional.of(job));
        when(reportJobRepository.findByJobIdAndCompanyId("job-1", 10L)).thenReturn(Optional.of(job));
        when(reportJobRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        reportJobService.complete("job-1", "ok", content, "report.xlsx", "application/test");
        var file = reportJobService.getReportFile("job-1", 10L);

        assertEquals("completed", job.getStatus());
        assertEquals("report.xlsx", file.fileName());
        assertEquals("application/test", file.contentType());
        assertArrayEquals(content, file.content());
        verify(reportJobRepository).save(job);
    }

    @Test
    void shouldMarkInterruptedJobsAsFailedAfterStartup() {
        ReportJob queuedJob = new ReportJob();
        queuedJob.setJobId("job-queued");
        queuedJob.setStatus("queued");
        queuedJob.setMessage("na fila");

        ReportJob runningJob = new ReportJob();
        runningJob.setJobId("job-running");
        runningJob.setStatus("running");
        runningJob.setMessage("rodando");

        when(reportJobRepository.findByStatusIn(List.of("queued", "running")))
                .thenReturn(List.of(queuedJob, runningJob));

        reportJobService.markInterruptedJobsAsFailed();

        assertEquals("failed", queuedJob.getStatus());
        assertEquals("failed", runningJob.getStatus());
        assertEquals("Falha", queuedJob.getStage());
        assertNotNull(queuedJob.getFinishedAt());
        verify(reportJobRepository).saveAll(List.of(queuedJob, runningJob));
    }
}
