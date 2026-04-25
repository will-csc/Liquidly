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

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist an invoice record.
    public Invoice createInvoice(Invoice invoice) {
        if (invoice == null) {
            throw new RuntimeException("Invoice is required");
        }
        invoice.setCompany(authenticatedUserService.getRequiredCompany());
        return invoiceRepository.save(invoice);
    }

    // Return all invoices.
    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return invoices filtered by company id.
    public List<Invoice> getInvoicesByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return invoiceRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return invoices filtered by project id.
    public List<Invoice> getInvoicesByProjectId(Long projectId) {
        return invoiceRepository.findByCompanyIdAndProjectId(authenticatedUserService.getRequiredCompanyId(), projectId);
    }

    // Return an invoice record by invoice number and company id.
    public Optional<Invoice> getInvoiceByNumberAndCompanyId(String invoiceNumber, Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return invoiceRepository.findByInvoiceNumberAndCompanyId(invoiceNumber, resolvedCompanyId);
    }

    // Return an invoice by id.
    public Invoice getInvoiceById(Long id) {
        return getInvoiceByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete an invoice by id.
    public void deleteInvoice(Long id) {
        invoiceRepository.delete(getInvoiceByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    public Invoice getInvoiceByIdForCompany(Long id, Long companyId) {
        return invoiceRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }
}
