package com.liquidly.api.controller;

import com.liquidly.api.model.Po;
import com.liquidly.api.service.PoService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/pos")
@CrossOrigin(origins = "*")
public class PoController {

    @Autowired
    private PoService poService;

    // Create a purchase order (PO) record.
    @PostMapping
    public ResponseEntity<Po> createPo(@RequestBody Po po) {
        return ResponseEntity.ok(poService.createPo(po));
    }

    // Return all PO records.
    @GetMapping
    public ResponseEntity<List<Po>> getAllPos() {
        return ResponseEntity.ok(poService.getAllPos());
    }

    // Return PO records filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Po>> getPosByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(poService.getPosByCompanyId(companyId));
    }

    // Return PO records filtered by PO number.
    @GetMapping("/number/{poNumber}")
    public ResponseEntity<List<Po>> getPosByPoNumber(@PathVariable String poNumber) {
        return ResponseEntity.ok(poService.getPosByPoNumber(poNumber));
    }

    // Return a PO record by id.
    @GetMapping("/{id}")
    public ResponseEntity<Po> getPoById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPoById(id));
    }

    // Delete a PO record by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePo(@PathVariable Long id) {
        poService.deletePo(id);
        return ResponseEntity.noContent().build();
    }
}
