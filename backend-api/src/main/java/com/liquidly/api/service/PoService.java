package com.liquidly.api.service;

import com.liquidly.api.model.Po;
import com.liquidly.api.repository.PoRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PoService {

    @Autowired
    private PoRepository poRepository;

    // Persist a purchase order (PO) record.
    public Po createPo(Po po) {
        return poRepository.save(po);
    }

    // Return all PO records.
    public List<Po> getAllPos() {
        return poRepository.findAll();
    }

    // Return PO records filtered by company id.
    public List<Po> getPosByCompanyId(Long companyId) {
        return poRepository.findByCompanyId(companyId);
    }

    // Return PO records filtered by invoice number.
    public List<Po> getPosByInvoiceNumber(String invoiceNumber) {
        return poRepository.findByInvoiceNumber(invoiceNumber);
    }

    // Return a PO record by id.
    public Po getPoById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with id: " + id));
    }

    // Delete a PO record by id.
    public void deletePo(Long id) {
        poRepository.deleteById(id);
    }
}
