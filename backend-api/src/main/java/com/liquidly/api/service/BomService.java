package com.liquidly.api.service;

import com.liquidly.api.dto.CreateBomRequest;
import com.liquidly.api.model.Bom;
import com.liquidly.api.model.Project;
import com.liquidly.api.repository.BomRepository;
import com.liquidly.api.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BomService {

    @Autowired
    private BomRepository bomRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist a BOM entry, applying defaults for quantities and project name when missing.
    public Bom createBom(CreateBomRequest request) {
        if (request == null) {
            throw new RuntimeException("BOM is required");
        }

        Long companyId = authenticatedUserService.getRequiredCompanyId();
        Project project = requireProjectInCompany(request.getProjectId(), companyId);
        Bom bom = new Bom();
        bom.setProject(project);
        bom.setProjectName(normalizeProjectName(request.getProjectName(), project));
        bom.setItemCode(normalizeRequired(request.getItemCode(), "Item code is required"));
        bom.setItemName(normalizeRequired(request.getItemName(), "Item name is required"));
        bom.setUmBom(normalizeRequired(request.getUmBom(), "BOM unit is required"));
        bom.setQntd(request.getQntd());
        bom.setRemainingQntd(request.getRemainingQntd() == null ? request.getQntd() : request.getRemainingQntd());

        // Default missing quantities to zero / initial values.
        if (bom.getQntd() == null) {
            bom.setQntd(BigDecimal.ZERO);
        }

        if (bom.getRemainingQntd() == null) {
            bom.setRemainingQntd(bom.getQntd());
        }

        // Ensure projectName is populated for downstream queries and UI usage.
        bom.setCompany(authenticatedUserService.getRequiredCompany());
        return bomRepository.save(bom);
    }

    // Update an existing BOM entry while preserving immutable metadata when omitted.
    public Bom updateBom(Long id, Bom bom) {
        Long companyId = authenticatedUserService.getRequiredCompanyId();
        Bom existing = getBomByIdForCompany(id, companyId);

        if (bom == null) {
            throw new RuntimeException("BOM is required");
        }

        if (bom.getProject() != null && bom.getProject().getId() != null) {
            existing.setProject(requireProjectInCompany(bom.getProject().getId(), companyId));
        }

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

        existing.setCompany(authenticatedUserService.getRequiredCompany());

        return bomRepository.save(existing);
    }

    // Return all BOM entries.
    public List<Bom> getAllBoms() {
        return bomRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return BOM entries filtered by company id.
    public List<Bom> getBomsByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return bomRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return BOM entries filtered by project id.
    public List<Bom> getBomsByProjectId(Long projectId) {
        return bomRepository.findByProjectIdAndCompanyId(projectId, authenticatedUserService.getRequiredCompanyId());
    }

    // Return a BOM entry by id.
    public Bom getBomById(Long id) {
        return getBomByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete a BOM entry by id.
    public void deleteBom(Long id) {
        bomRepository.delete(getBomByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    public Bom getBomByIdForCompany(Long id, Long companyId) {
        return bomRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("BOM not found with id: " + id));
    }

    private Project requireProjectInCompany(Long projectId, Long companyId) {
        if (projectId == null) {
            throw new RuntimeException("Project is required");
        }
        return projectRepository.findByIdAndCompanyId(projectId, companyId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
    }

    private String normalizeRequired(String value, String errorMessage) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return normalized;
    }

    private String normalizeProjectName(String projectName, Project project) {
        if (projectName != null && !projectName.trim().isEmpty()) {
            return projectName.trim();
        }
        if (project != null && project.getName() != null && !project.getName().trim().isEmpty()) {
            return project.getName().trim();
        }
        return "Default Project";
    }
}
