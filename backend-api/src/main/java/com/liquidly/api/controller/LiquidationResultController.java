package com.liquidly.api.controller;

import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.service.LiquidationResultService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

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
