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

    public Invoice createInvoice(Invoice invoice) {
        return invoiceRepository.save(invoice);
    }

    public List<Invoice> getAllInvoices() {
        return invoiceRepository.findAll();
    }

    public List<Invoice> getInvoicesByCompanyId(Long companyId) {
        return invoiceRepository.findByCompanyId(companyId);
    }

    public List<Invoice> getInvoicesByProjectId(Long projectId) {
        return invoiceRepository.findByProjectId(projectId);
    }

    public Optional<Invoice> getInvoiceByNumberAndCompanyId(String invoiceNumber, Long companyId) {
        return invoiceRepository.findByInvoiceNumberAndCompanyId(invoiceNumber, companyId);
    }

    public Invoice getInvoiceById(Long id) {
        return invoiceRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Invoice not found with id: " + id));
    }

    public void deleteInvoice(Long id) {
        invoiceRepository.deleteById(id);
    }
}
