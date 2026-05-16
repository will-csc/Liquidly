package com.liquidly.api.controller;

import com.liquidly.api.model.Bom;
import com.liquidly.api.service.BomService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/boms")
@CrossOrigin(origins = "*")
public class BomController {

    private static final Logger logger = LoggerFactory.getLogger(BomController.class);

    @Autowired
    private BomService bomService;

    // Create a BOM entry.
    @PostMapping
    public ResponseEntity<Bom> createBom(@RequestBody Bom bom) {
        logger.info("Recebido createBom: itemCode={}, projectName={}", bom.getItemCode(), bom.getProjectName());
        Bom created = bomService.createBom(bom);
        logger.info("BOM criado: id={}, itemCode={}, projectName={}", created.getId(), created.getItemCode(), created.getProjectName());
        return ResponseEntity.ok(created);
    }

    // Update an existing BOM entry.
    @PutMapping("/{id}")
    public ResponseEntity<Bom> updateBom(@PathVariable Long id, @RequestBody Bom bom) {
        logger.info("Recebido updateBom: id={}, itemCode={}", id, bom.getItemCode());
        Bom updated = bomService.updateBom(id, bom);
        logger.info("BOM atualizado: id={}, itemCode={}, remainingQntd={}", updated.getId(), updated.getItemCode(), updated.getRemainingQntd());
        return ResponseEntity.ok(updated);
    }

    // Return all BOM entries.
    @GetMapping
    public ResponseEntity<List<Bom>> getAllBoms() {
        List<Bom> boms = bomService.getAllBoms();
        logger.info("Listagem de BOM concluida: total={}", boms.size());
        return ResponseEntity.ok(boms);
    }

    // Return BOM entries filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Bom>> getBomsByCompanyId(@PathVariable Long companyId) {
        List<Bom> boms = bomService.getBomsByCompanyId(companyId);
        logger.info("Listagem de BOM por company concluida: companyId={}, total={}", companyId, boms.size());
        return ResponseEntity.ok(boms);
    }

    // Return BOM entries filtered by project id.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Bom>> getBomsByProjectId(@PathVariable Long projectId) {
        List<Bom> boms = bomService.getBomsByProjectId(projectId);
        logger.info("Listagem de BOM por projeto concluida: projectId={}, total={}", projectId, boms.size());
        return ResponseEntity.ok(boms);
    }

    // Return a BOM entry by id.
    @GetMapping("/{id}")
    public ResponseEntity<Bom> getBomById(@PathVariable Long id) {
        Bom bom = bomService.getBomById(id);
        logger.info("BOM encontrado: id={}, itemCode={}", bom.getId(), bom.getItemCode());
        return ResponseEntity.ok(bom);
    }

    // Delete a BOM entry by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteBom(@PathVariable Long id) {
        logger.info("Recebido deleteBom: id={}", id);
        bomService.deleteBom(id);
        logger.info("BOM deletado: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
