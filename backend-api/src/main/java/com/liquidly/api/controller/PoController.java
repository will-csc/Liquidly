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

    @PostMapping
    public ResponseEntity<Po> createPo(@RequestBody Po po) {
        return ResponseEntity.ok(poService.createPo(po));
    }

    @GetMapping
    public ResponseEntity<List<Po>> getAllPos() {
        return ResponseEntity.ok(poService.getAllPos());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Po>> getPosByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(poService.getPosByCompanyId(companyId));
    }

    @GetMapping("/invoice/{invoiceNumber}")
    public ResponseEntity<List<Po>> getPosByInvoiceNumber(@PathVariable String invoiceNumber) {
        return ResponseEntity.ok(poService.getPosByInvoiceNumber(invoiceNumber));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Po> getPoById(@PathVariable Long id) {
        return ResponseEntity.ok(poService.getPoById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletePo(@PathVariable Long id) {
        poService.deletePo(id);
        return ResponseEntity.noContent().build();
    }
}
