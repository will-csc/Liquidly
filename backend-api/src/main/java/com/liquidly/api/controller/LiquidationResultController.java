package com.liquidly.api.controller;

import com.liquidly.api.dto.ReportJobStartResponse;
import com.liquidly.api.dto.ReportJobStatusResponse;
import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.service.LiquidationResultService;
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

    @Autowired
    private LiquidationResultService liquidationResultService;

    // Create a liquidation result record.
    @PostMapping
    public ResponseEntity<LiquidationResult> createLiquidationResult(@RequestBody LiquidationResult result) {
        return ResponseEntity.ok(liquidationResultService.createLiquidationResult(result));
    }

    // Run the liquidation process for a given company/project and return the generated results.
    @PostMapping("/run")
    public ResponseEntity<List<LiquidationResult>> runLiquidation(
            @RequestParam Long companyId,
            @RequestParam Long projectId
    ) {
        return ResponseEntity.ok(liquidationResultService.runLiquidation(companyId, projectId));
    }

    // Run liquidation in background and prepare the Excel file for download.
    @PostMapping("/run-report")
    public ResponseEntity<ReportJobStartResponse> runReport(@RequestBody Map<String, Object> payload) {
        Long companyId = payload.get("companyId") == null ? null : Long.valueOf(payload.get("companyId").toString());
        Long projectId = payload.get("projectId") == null ? null : Long.valueOf(payload.get("projectId").toString());
        String selectedBom = payload.get("selectedBom") == null ? null : payload.get("selectedBom").toString();
        String startDate = payload.get("startDate") == null ? null : payload.get("startDate").toString();
        String endDate = payload.get("endDate") == null ? null : payload.get("endDate").toString();

        ReportJobStartResponse response = liquidationResultService.startReportJob(
                companyId,
                projectId,
                selectedBom,
                startDate,
                endDate
        );
        return ResponseEntity.accepted().body(response);
    }

    @GetMapping("/run-report/{jobId}/status")
    public ResponseEntity<ReportJobStatusResponse> getRunReportStatus(
            @PathVariable String jobId,
            @RequestParam Long companyId
    ) {
        return ResponseEntity.ok(liquidationResultService.getReportJobStatus(jobId, companyId));
    }

    @GetMapping("/run-report/{jobId}/download")
    public ResponseEntity<byte[]> downloadRunReport(
            @PathVariable String jobId,
            @RequestParam Long companyId
    ) {
        var reportFile = liquidationResultService.getReportJobFile(jobId, companyId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(reportFile.contentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + reportFile.fileName() + "\"")
                .body(reportFile.content());
    }

    // Return all liquidation results.
    @GetMapping
    public ResponseEntity<List<LiquidationResult>> getAllLiquidationResults() {
        return ResponseEntity.ok(liquidationResultService.getAllLiquidationResults());
    }

    // Return liquidation results filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultsByCompanyId(companyId));
    }

    // Return liquidation results filtered by project id.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultsByProjectId(projectId));
    }

    // Return a liquidation result by id.
    @GetMapping("/{id}")
    public ResponseEntity<LiquidationResult> getLiquidationResultById(@PathVariable Long id) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultById(id));
    }

    // Delete a liquidation result by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLiquidationResult(@PathVariable Long id) {
        liquidationResultService.deleteLiquidationResult(id);
        return ResponseEntity.noContent().build();
    }
}
