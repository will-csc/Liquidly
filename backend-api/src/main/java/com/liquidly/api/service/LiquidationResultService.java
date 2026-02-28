package com.liquidly.api.service;

import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.repository.LiquidationResultRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class LiquidationResultService {

    @Autowired
    private LiquidationResultRepository liquidationResultRepository;

    public LiquidationResult createLiquidationResult(LiquidationResult result) {
        return liquidationResultRepository.save(result);
    }

    public List<LiquidationResult> getAllLiquidationResults() {
        return liquidationResultRepository.findAll();
    }

    public List<LiquidationResult> getLiquidationResultsByCompanyId(Long companyId) {
        return liquidationResultRepository.findByCompanyId(companyId);
    }

    public List<LiquidationResult> getLiquidationResultsByProjectId(Long projectId) {
        return liquidationResultRepository.findByProjectId(projectId);
    }

    public LiquidationResult getLiquidationResultById(Long id) {
        return liquidationResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liquidation Result not found with id: " + id));
    }

    public void deleteLiquidationResult(Long id) {
        liquidationResultRepository.deleteById(id);
    }
}
