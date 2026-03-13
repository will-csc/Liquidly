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

    public Project createProject(Project project) {
        if (project == null) {
            throw new RuntimeException("Project is required");
        }
        if (project.getCompany() == null || project.getCompany().getId() == null) {
            throw new RuntimeException("Company is required");
        }
        if (project.getName() == null || project.getName().trim().isEmpty()) {
            throw new RuntimeException("Project name is required");
        }

        Long companyId = project.getCompany().getId();
        String normalizedName = project.getName().trim();
        if (projectRepository.existsByNameIgnoreCaseAndCompanyId(normalizedName, companyId)) {
            throw new RuntimeException("Project name already in use");
        }

        project.setName(normalizedName);
        return projectRepository.save(project);
    }

    public List<Project> getAllProjects() {
        return projectRepository.findAll();
    }

    public List<Project> getProjectsByCompanyId(Long companyId) {
        return projectRepository.findByCompanyId(companyId);
    }

    public Project getProjectById(Long id) {
        return projectRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + id));
    }

    public void deleteProject(Long id) {
        projectRepository.deleteById(id);
    }
}
