package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.repository.BomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BomService {

    @Autowired
    private BomRepository bomRepository;

    // Persist a BOM entry, applying defaults for quantities and project name when missing.
    public Bom createBom(Bom bom) {
        // Default missing quantities to zero / initial values.
        if (bom.getQntd() == null) {
            bom.setQntd(BigDecimal.ZERO);
        }

        if (bom.getRemainingQntd() == null) {
            bom.setRemainingQntd(bom.getQntd());
        }

        // Ensure projectName is populated for downstream queries and UI usage.
        String projectName = bom.getProjectName();
        boolean hasProjectName = projectName != null && !projectName.trim().isEmpty();
        if (!hasProjectName) {
            String derived =
                    bom.getProject() != null && bom.getProject().getName() != null && !bom.getProject().getName().trim().isEmpty()
                            ? bom.getProject().getName().trim()
                            : "Default Project";
            bom.setProjectName(derived);
        }

        return bomRepository.save(bom);
    }

    // Update an existing BOM entry while preserving immutable metadata when omitted.
    public Bom updateBom(Long id, Bom bom) {
        Bom existing = getBomById(id);

        if (bom == null) {
            throw new RuntimeException("BOM is required");
        }

        existing.setProject(bom.getProject() != null ? bom.getProject() : existing.getProject());

        String projectName = bom.getProjectName();
        if (projectName != null && !projectName.trim().isEmpty()) {
            existing.setProjectName(projectName.trim());
        } else if (existing.getProject() != null && existing.getProject().getName() != null && !existing.getProject().getName().trim().isEmpty()) {
            existing.setProjectName(existing.getProject().getName().trim());
        }

        existing.setItemCode(bom.getItemCode());
        existing.setItemName(bom.getItemName());
        existing.setUmBom(bom.getUmBom());
        existing.setQntd(bom.getQntd() == null ? BigDecimal.ZERO : bom.getQntd());
        existing.setRemainingQntd(bom.getRemainingQntd() == null ? existing.getQntd() : bom.getRemainingQntd());

        if (bom.getCompany() != null && bom.getCompany().getId() != null) {
            existing.setCompany(bom.getCompany());
        }

        return bomRepository.save(existing);
    }

    // Return all BOM entries.
    public List<Bom> getAllBoms() {
        return bomRepository.findAll();
    }

    // Return BOM entries filtered by company id.
    public List<Bom> getBomsByCompanyId(Long companyId) {
        return bomRepository.findByCompanyId(companyId);
    }

    // Return BOM entries filtered by project id.
    public List<Bom> getBomsByProjectId(Long projectId) {
        return bomRepository.findByProjectId(projectId);
    }

    // Return a BOM entry by id.
    public Bom getBomById(Long id) {
        return bomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BOM not found with id: " + id));
    }

    // Delete a BOM entry by id.
    public void deleteBom(Long id) {
        bomRepository.deleteById(id);
    }
}
