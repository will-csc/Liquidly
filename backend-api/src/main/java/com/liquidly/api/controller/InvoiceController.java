package com.liquidly.api.controller;

import com.liquidly.api.dto.CreateInvoiceRequest;
import com.liquidly.api.model.Invoice;
import com.liquidly.api.service.InvoiceService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/invoices")
@CrossOrigin(origins = "*")
public class InvoiceController {

    private static final Logger logger = LoggerFactory.getLogger(InvoiceController.class);

    @Autowired
    private InvoiceService invoiceService;

    // Create an invoice.
    @PostMapping
    public ResponseEntity<Invoice> createInvoice(@Valid @RequestBody CreateInvoiceRequest request) {
        logger.info("Recebido createInvoice: projectId={}, invoiceNumber={}, itemCode={}",
                request.getProjectId(), request.getInvoiceNumber(), request.getItemCode());
        Invoice created = invoiceService.createInvoice(request);
        logger.info("Invoice criada: id={}, invoiceNumber={}, itemCode={}", created.getId(), created.getInvoiceNumber(), created.getItemCode());
        return ResponseEntity.ok(created);
    }

    // Return all invoices.
    @GetMapping
    public ResponseEntity<List<Invoice>> getAllInvoices() {
        List<Invoice> invoices = invoiceService.getAllInvoices();
        logger.info("Listagem de invoices concluida: total={}", invoices.size());
        return ResponseEntity.ok(invoices);
    }

    // Return invoices filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Invoice>> getInvoicesByCompanyId(@PathVariable Long companyId) {
        List<Invoice> invoices = invoiceService.getInvoicesByCompanyId(companyId);
        logger.info("Listagem de invoices por company concluida: companyId={}, total={}", companyId, invoices.size());
        return ResponseEntity.ok(invoices);
    }

    // Return invoices filtered by project id.
    @GetMapping("/project/{projectId}")
    public ResponseEntity<List<Invoice>> getInvoicesByProjectId(@PathVariable Long projectId) {
        List<Invoice> invoices = invoiceService.getInvoicesByProjectId(projectId);
        logger.info("Listagem de invoices por projeto concluida: projectId={}, total={}", projectId, invoices.size());
        return ResponseEntity.ok(invoices);
    }

    // Return an invoice by id.
    @GetMapping("/{id}")
    public ResponseEntity<Invoice> getInvoiceById(@PathVariable Long id) {
        Invoice invoice = invoiceService.getInvoiceById(id);
        logger.info("Invoice encontrada: id={}, invoiceNumber={}", invoice.getId(), invoice.getInvoiceNumber());
        return ResponseEntity.ok(invoice);
    }

    // Delete an invoice by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteInvoice(@PathVariable Long id) {
        logger.info("Recebido deleteInvoice: id={}", id);
        invoiceService.deleteInvoice(id);
        logger.info("Invoice deletada: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
