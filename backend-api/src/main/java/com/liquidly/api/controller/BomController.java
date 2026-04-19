package com.liquidly.api.controller;

import com.liquidly.api.model.Bom;
import com.liquidly.api.service.BomService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boms")
@CrossOrigin(origins = "*")
public class BomController {

    @Autowired
    private BomService bomService;

    // Create a BOM entry.
    @PostMapping
    public ResponseEntity<Bom> createBom(@RequestBody Bom bom) {
        return ResponseEntity.ok(bomService.createBom(bom));
    }

    // Update an existing BOM entry.
    @PutMapping("/{id}")
    public ResponseEntity<Bom> updateBom(@PathVariable Long id, @RequestBody Bom bom) {
        return ResponseEntity.ok(bomService.updateBom(id, bom));
    }

    // Return all BOM entries.
    @GetMapping
    public ResponseEntity<List<Bom>> getAllBoms() {
        return ResponseEntity.ok(bomService.getAllBoms());
    }

    // Return BOM entries filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Bom>> getBomsByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(bomService.getBomsByCompanyId(companyId));
    }

    // Return BOM entries filtered by project id.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Bom>> getBomsByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(bomService.getBomsByProjectId(projectId));
    }

    // Return a BOM entry by id.
    @GetMapping("/{id}")
    public ResponseEntity<Bom> getBomById(@PathVariable Long id) {
        return ResponseEntity.ok(bomService.getBomById(id));
    }

    // Delete a BOM entry by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBom(@PathVariable Long id) {
        bomService.deleteBom(id);
        return ResponseEntity.noContent().build();
    }
}
