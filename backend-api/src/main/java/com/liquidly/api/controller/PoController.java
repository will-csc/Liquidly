package com.liquidly.api.controller;

import com.liquidly.api.model.Po;
import com.liquidly.api.service.PoService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*")
public class PoController {

    private static final Logger logger = LoggerFactory.getLogger(PoController.class);

    @Autowired
    private PoService poService;

    // Create a purchase order (PO) record.
    @PostMapping
    public ResponseEntity<Po> createPo(@RequestBody Po po) {
        logger.info("Recebido createPo: poNumber={}, itemCode={}", po.getPoNumber(), po.getItemCode());
        Po created = poService.createPo(po);
        logger.info("PO criada: id={}, poNumber={}, itemCode={}", created.getId(), created.getPoNumber(), created.getItemCode());
        return ResponseEntity.ok(created);
    }

    // Return all PO records.
    @GetMapping
    public ResponseEntity<List<Po>> getAllPos() {
        List<Po> pos = poService.getAllPos();
        logger.info("Listagem de POs concluida: total={}", pos.size());
        return ResponseEntity.ok(pos);
    }

    // Return PO records filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Po>> getPosByCompanyId(@PathVariable Long companyId) {
        List<Po> pos = poService.getPosByCompanyId(companyId);
        logger.info("Listagem de POs por company concluida: companyId={}, total={}", companyId, pos.size());
        return ResponseEntity.ok(pos);
    }

    // Return PO records filtered by PO number.
    @GetMapping("/number/{poNumber}")
    public ResponseEntity<List<Po>> getPosByPoNumber(@PathVariable String poNumber) {
        List<Po> pos = poService.getPosByPoNumber(poNumber);
        logger.info("Listagem de POs por numero concluida: poNumber={}, total={}", poNumber, pos.size());
        return ResponseEntity.ok(pos);
    }

    // Return a PO record by id.
    @GetMapping("/{id}")
    public ResponseEntity<Po> getPoById(@PathVariable Long id) {
        Po po = poService.getPoById(id);
        logger.info("PO encontrada: id={}, poNumber={}", po.getId(), po.getPoNumber());
        return ResponseEntity.ok(po);
    }

    // Delete a PO record by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePo(@PathVariable Long id) {
        logger.info("Recebido deletePo: id={}", id);
        poService.deletePo(id);
        logger.info("PO deletada: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
