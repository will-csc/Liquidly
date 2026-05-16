package com.liquidly.api.controller;

import com.liquidly.api.dto.ReportJobStartResponse;
import com.liquidly.api.dto.ReportJobStatusResponse;
import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.service.LiquidationResultService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/liquidation-results")
@CrossOrigin(origins = "*")
public class LiquidationResultController {

    private static final Logger logger = LoggerFactory.getLogger(LiquidationResultController.class);

    @Autowired
    private LiquidationResultService liquidationResultService;

    // Create a liquidation result record.
    @PostMapping
    public ResponseEntity<LiquidationResult> createLiquidationResult(@RequestBody LiquidationResult result) {
        logger.info("Recebido createLiquidationResult: projectId={}, companyId={}",
                result.getProject() == null ? null : result.getProject().getId(),
                result.getCompany() == null ? null : result.getCompany().getId());
        LiquidationResult created = liquidationResultService.createLiquidationResult(result);
        logger.info("LiquidationResult criado: id={}", created.getId());
        return ResponseEntity.ok(created);
    }

    // Run the liquidation process for a given company/project and return the generated results.
    @PostMapping("/run")
    public ResponseEntity<List<LiquidationResult>> runLiquidation(
            @RequestParam Long companyId,
            @RequestParam Long projectId
    ) {
        logger.info("Recebido runLiquidation: companyId={}, projectId={}", companyId, projectId);
        List<LiquidationResult> results = liquidationResultService.runLiquidation(companyId, projectId);
        logger.info("runLiquidation concluido: companyId={}, projectId={}, totalResultados={}", companyId, projectId, results.size());
        return ResponseEntity.ok(results);
    }

    // Run liquidation in background and prepare the Excel file for download.
    @PostMapping("/run-report")
    public ResponseEntity<ReportJobStartResponse> runReport(@RequestBody Map<String, Object> payload) {
        Long companyId = payload.get("companyId") == null ? null : Long.valueOf(payload.get("companyId").toString());
        Long projectId = payload.get("projectId") == null ? null : Long.valueOf(payload.get("projectId").toString());
        String selectedBom = payload.get("selectedBom") == null ? null : payload.get("selectedBom").toString();
        String startDate = payload.get("startDate") == null ? null : payload.get("startDate").toString();
        String endDate = payload.get("endDate") == null ? null : payload.get("endDate").toString();
        logger.info("Recebido runReport: companyId={}, projectId={}, selectedBom={}, startDate={}, endDate={}",
                companyId, projectId, selectedBom, startDate, endDate);

        ReportJobStartResponse response = liquidationResultService.startReportJob(
                companyId,
                projectId,
                selectedBom,
                startDate,
                endDate
        );
        logger.info("Job de relatorio criado: jobId={}, companyId={}, projectId={}, status={}",
                response.getJobId(), companyId, projectId, response.getStatus());
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/run-report/{jobId}/status")
    public ResponseEntity<ReportJobStatusResponse> getRunReportStatus(
            @PathVariable String jobId,
            @RequestParam Long companyId
    ) {
        ReportJobStatusResponse status = liquidationResultService.getReportJobStatus(jobId, companyId);
        logger.info("Status de relatorio consultado: jobId={}, companyId={}, status={}, progress={}",
                jobId, companyId, status.getStatus(), status.getProgress());
        return ResponseEntity.ok(status);
    }

    @GetMapping("/run-report/{jobId}/download")
    public ResponseEntity<byte[]> downloadRunReport(
            @PathVariable String jobId,
            @RequestParam Long companyId
    ) {
        logger.info("Download de relatorio solicitado: jobId={}, companyId={}", jobId, companyId);
        var reportFile = liquidationResultService.getReportJobFile(jobId, companyId);
        logger.info("Download de relatorio pronto: jobId={}, companyId={}, fileName={}, sizeBytes={}",
                jobId, companyId, reportFile.fileName(), reportFile.content().length);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(reportFile.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportFile.fileName() + "\"")
                .body(reportFile.content());
    }

    // Return all liquidation results.
    @GetMapping
    public ResponseEntity<List<LiquidationResult>> getAllLiquidationResults() {
        List<LiquidationResult> results = liquidationResultService.getAllLiquidationResults();
        logger.info("Listagem de liquidation results concluida: total={}", results.size());
        return ResponseEntity.ok(results);
    }

    // Return liquidation results filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByCompanyId(@PathVariable Long companyId) {
        List<LiquidationResult> results = liquidationResultService.getLiquidationResultsByCompanyId(companyId);
        logger.info("Listagem de liquidation results por company concluida: companyId={}, total={}", companyId, results.size());
        return ResponseEntity.ok(results);
    }

    // Return liquidation results filtered by project id.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByProjectId(@PathVariable Long projectId) {
        List<LiquidationResult> results = liquidationResultService.getLiquidationResultsByProjectId(projectId);
        logger.info("Listagem de liquidation results por projeto concluida: projectId={}, total={}", projectId, results.size());
        return ResponseEntity.ok(results);
    }

    // Return a liquidation result by id.
    @GetMapping("/{id}")
    public ResponseEntity<LiquidationResult> getLiquidationResultById(@PathVariable Long id) {
        LiquidationResult result = liquidationResultService.getLiquidationResultById(id);
        logger.info("LiquidationResult encontrado: id={}", result.getId());
        return ResponseEntity.ok(result);
    }

    // Delete a liquidation result by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLiquidationResult(@PathVariable Long id) {
        logger.info("Recebido deleteLiquidationResult: id={}", id);
        liquidationResultService.deleteLiquidationResult(id);
        logger.info("LiquidationResult deletado: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
