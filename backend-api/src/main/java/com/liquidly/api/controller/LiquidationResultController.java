package com.liquidly.api.controller;

import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.service.LiquidationResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.List;

@RestController
@RequestMapping("/api/liquidation-results")
@CrossOrigin(origins = "*")
public class LiquidationResultController {

    @Autowired
    private LiquidationResultService liquidationResultService;

    @PostMapping
    public ResponseEntity<LiquidationResult> createLiquidationResult(@RequestBody LiquidationResult result) {
        return ResponseEntity.ok(liquidationResultService.createLiquidationResult(result));
    }

    @PostMapping("/run")
    public ResponseEntity<List<LiquidationResult>> runLiquidation(
            @RequestParam Long companyId,
            @RequestParam Long projectId
    ) {
        return ResponseEntity.ok(liquidationResultService.runLiquidation(companyId, projectId));
    }

    @PostMapping("/run-report")
    public ResponseEntity<Map<String, Object>> runReport(@RequestBody Map<String, Object> payload) {
        Long companyId = payload.get("companyId") == null ? null : Long.valueOf(payload.get("companyId").toString());
        Long projectId = payload.get("projectId") == null ? null : Long.valueOf(payload.get("projectId").toString());
        String toEmail = payload.get("email") == null ? null : payload.get("email").toString();
        String selectedBom = payload.get("selectedBom") == null ? null : payload.get("selectedBom").toString();
        String startDate = payload.get("startDate") == null ? null : payload.get("startDate").toString();
        String endDate = payload.get("endDate") == null ? null : payload.get("endDate").toString();

        liquidationResultService.runLiquidation(companyId, projectId);
        liquidationResultService.sendReportEmail(companyId, projectId, toEmail, selectedBom, startDate, endDate);

        return ResponseEntity.ok(Map.of("message", "ok"));
    }

    @GetMapping
    public ResponseEntity<List<LiquidationResult>> getAllLiquidationResults() {
        return ResponseEntity.ok(liquidationResultService.getAllLiquidationResults());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultsByCompanyId(companyId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<LiquidationResult>> getLiquidationResultsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultsByProjectId(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<LiquidationResult> getLiquidationResultById(@PathVariable Long id) {
        return ResponseEntity.ok(liquidationResultService.getLiquidationResultById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteLiquidationResult(@PathVariable Long id) {
        liquidationResultService.deleteLiquidationResult(id);
        return ResponseEntity.noContent().build();
    }
}
