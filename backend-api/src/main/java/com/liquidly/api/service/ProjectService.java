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

    // Persist a project for a company, validating required fields and name uniqueness per company.
    public Project createProject(Project project) {
        // Validate required payload fields.
        if (project == null) {
            throw new RuntimeException("Project is required");
        }
        if (project.getCompany() == null || project.getCompany().getId() == null) {
            throw new RuntimeException("Company is required");
        }
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            throw new RuntimeException("Project name is required");
        }

        // Enforce per-company unique project names (case-insensitive).
        Long companyId = project.getCompany().getId();
        String normalizedName = project.getName().trim();
        if (projectRepository.existsByNameIgnoreCaseAndCompanyId(normalizedName, companyId)) {
            throw new RuntimeException("Project name already in use");
        }

        // Normalize the stored project name.
        project.setName(normalizedName);
        return projectRepository.save(project);
    }

    // Return all projects.
    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    // Return projects filtered by company id.
    public List<Project> getProjectsByCompanyId(Long companyId) {
        return projectRepository.findByCompanyId(companyId);
    }

    // Return a project by id.
    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    // Delete a project by id.
    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}
