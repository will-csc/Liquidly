package com.liquidly.api.controller;

import com.liquidly.api.model.Project;
import com.liquidly.api.service.ProjectService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@CrossOrigin(origins = "*") // Allows requests from frontend
public class ProjectController {

    private static final Logger logger = LoggerFactory.getLogger(ProjectController.class);

    @Autowired
    private ProjectService projectService;

    // Create a project.
    @PostMapping
    public ResponseEntity<Project> createProject(@RequestBody Project project) {
        logger.info("Recebido createProject: name={}", project.getName());
        Project created = projectService.createProject(project);
        logger.info("Projeto criado: id={}, name={}", created.getId(), created.getName());
        return ResponseEntity.ok(created);
    }

    // Update an existing project.
    @PutMapping("/{id}")
    public ResponseEntity<Project> updateProject(@PathVariable Long id, @RequestBody Project project) {
        logger.info("Recebido updateProject: id={}, name={}", id, project.getName());
        Project updated = projectService.updateProject(id, project);
        logger.info("Projeto atualizado: id={}, name={}", updated.getId(), updated.getName());
        return ResponseEntity.ok(updated);
    }

    // Return all projects.
    @GetMapping
    public ResponseEntity<List<Project>> getAllProjects() {
        List<Project> projects = projectService.getAllProjects();
        logger.info("Listagem de projetos concluida: total={}", projects.size());
        return ResponseEntity.ok(projects);
    }

    // Return projects filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Project>> getProjectsByCompanyId(@PathVariable Long companyId) {
        List<Project> projects = projectService.getProjectsByCompanyId(companyId);
        logger.info("Listagem de projetos por company concluida: companyId={}, total={}", companyId, projects.size());
        return ResponseEntity.ok(projects);
    }

    // Return a project by id.
    @GetMapping("/{id}")
    public ResponseEntity<Project> getProjectById(@PathVariable Long id) {
        Project project = projectService.getProjectById(id);
        logger.info("Projeto encontrado: id={}, name={}", project.getId(), project.getName());
        return ResponseEntity.ok(project);
    }

    // Delete a project by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProject(@PathVariable Long id) {
        logger.info("Recebido deleteProject: id={}", id);
        projectService.deleteProject(id);
        logger.info("Projeto deletado: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
