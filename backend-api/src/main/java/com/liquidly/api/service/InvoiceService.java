package com.liquidly.api.service;

import com.liquidly.api.dto.CreateInvoiceRequest;
import com.liquidly.api.model.Invoice;
import com.liquidly.api.model.Project;
import com.liquidly.api.repository.InvoiceRepository;
import com.liquidly.api.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class InvoiceService {

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist an invoice record.
    public Invoice createInvoice(CreateInvoiceRequest request) {
        if (request == null) {
            throw new RuntimeException("Invoice is required");
        }

        Long companyId = authenticatedUserService.getRequiredCompanyId();
        Project project = requireProjectInCompany(request.getProjectId(), companyId);
        Invoice invoice = new Invoice();
        invoice.setProject(project);
        invoice.setItemCode(normalizeRequired(request.getItemCode(), "Item code is required"));
        invoice.setInvoiceNumber(normalizeRequired(request.getInvoiceNumber(), "Invoice number is required"));
        invoice.setCountry(normalizeRequired(request.getCountry(), "Country is required"));
        invoice.setInvoiceDateString(normalizeRequired(request.getInvoiceDateString(), "Invoice date is required"));
        invoice.setInvoiceValue(request.getInvoiceValue());
        invoice.setQntdInvoice(request.getQntdInvoice());
        invoice.setUmInvoice(normalizeRequired(request.getUmInvoice(), "Invoice unit is required"));
        invoice.setRemainingQntd(request.getRemainingQntd() == null ? request.getQntdInvoice() : request.getRemainingQntd());
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

    private Project requireProjectInCompany(Long projectId, Long companyId) {
        if (projectId == null) {
            throw new RuntimeException("Project is required");
        }
        return projectRepository.findByIdAndCompanyId(projectId, companyId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
    }

    private String normalizeRequired(String value, String errorMessage) {
        String normalized = value == null ? "" : value.trim();
        if (normalized.isEmpty()) {
            throw new RuntimeException(errorMessage);
        }
        return normalized;
    }
}
