package com.liquidly.api.service;

import com.liquidly.api.model.Invoice;
import com.liquidly.api.repository.InvoiceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    // Persist an invoice record.
    public Invoice createInvoice(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    // Return all invoices.
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    // Return invoices filtered by company id.
    public List<Invoice> getInvoicesByCompanyId(Long companyId) {
        return invoiceRepository.findByCompanyId(companyId);
    }

    // Return invoices filtered by project id.
    public List<Invoice> getInvoicesByProjectId(Long projectId) {
        return invoiceRepository.findByProjectId(projectId);
    }

    // Return an invoice record by invoice number and company id.
    public Optional<Invoice> getInvoiceByNumberAndCompanyId(String invoiceNumber, Long companyId) {
        return invoiceRepository.findByInvoiceNumberAndCompanyId(invoiceNumber, companyId);
    }

    // Return an invoice by id.
    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    // Delete an invoice by id.
    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}
