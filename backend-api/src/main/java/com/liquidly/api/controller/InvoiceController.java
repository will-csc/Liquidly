package com.liquidly.api.controller;

import com.liquidly.api.model.Invoice;
import com.liquidly.api.service.InvoiceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    @Autowired
    private InvoiceService invoiceService;

    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@RequestBody Invoice invoice) {
        return ResponseEntity.ok(invoiceService.createInvoice(invoice));
    }

    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        return ResponseEntity.ok(invoiceService.getAllInvoices());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Invoice>> getInvoicesByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByCompanyId(companyId));
    }

    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Invoice>> getInvoicesByProjectId(@PathVariable Long projectId) {
        return ResponseEntity.ok(invoiceService.getInvoicesByProjectId(projectId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        return ResponseEntity.ok(invoiceService.getInvoiceById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        invoiceService.deleteInvoice(id);
        return ResponseEntity.noContent().build();
    }
}
