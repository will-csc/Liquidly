package com.liquidly.api.service;

import com.liquidly.api.model.Project;
import com.liquidly.api.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProjectService {

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist a project for a company, validating required fields and name uniqueness per company.
    public Project createProject(Project project) {
        // Validate required payload fields.
        if (project == null) {
            throw new RuntimeException("Project is required");
        }
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            throw new RuntimeException("Project name is required");
        }

        // Enforce per-company unique project names (case-insensitive).
        Long companyId = authenticatedUserService.getRequiredCompanyId();
        String normalizedName = project.getName().trim();
        if (projectRepository.existsByNameIgnoreCaseAndCompanyId(normalizedName, companyId)) {
            throw new RuntimeException("Project name already in use");
        }

        // Normalize the stored project name.
        project.setName(normalizedName);
        project.setCompany(authenticatedUserService.getRequiredCompany());
        return projectRepository.save(project);
    }

    // Update an existing project, preserving its company when the payload omits it.
    public Project updateProject(Long id, Project project) {
        Long companyId = authenticatedUserService.getRequiredCompanyId();
        Project existing = getProjectByIdForCompany(id, companyId);

        if (project == null) {
            throw new RuntimeException("Project is required");
        }

        String normalizedName = project.getName() == null ? "" : project.getName().trim();
        if (normalizedName.isEmpty()) {
            throw new RuntimeException("Project name is required");
        }

        if (projectRepository.existsByNameIgnoreCaseAndCompanyIdAndIdNot(normalizedName, companyId, id)) {
            throw new RuntimeException("Project name already in use");
        }

        existing.setName(normalizedName);
        existing.setCompany(authenticatedUserService.getRequiredCompany());

        return projectRepository.save(existing);
    }

    // Return all projects.
    public List<Project> getAllProjects() {
        return projectRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return projects filtered by company id.
    public List<Project> getProjectsByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return projectRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return a project by id.
    public Project getProjectById(Long id) {
        return getProjectByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete a project by id.
    public void deleteProject(Long id) {
        projectRepository.delete(getProjectByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    public Project getProjectByIdForCompany(Long id, Long companyId) {
        return projectRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }
}
