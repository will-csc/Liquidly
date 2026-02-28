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

    public Po createPo(Po po) {
        return poRepository.save(po);
    }

    public List<Po> getAllPos() {
        return poRepository.findAll();
    }

    public List<Po> getPosByCompanyId(Long companyId) {
        return poRepository.findByCompanyId(companyId);
    }

    public List<Po> getPosByInvoiceNumber(String invoiceNumber) {
        return poRepository.findByInvoiceNumber(invoiceNumber);
    }

    public Po getPoById(Long id) {
        return poRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("PO not found with id: " + id));
    }

    public void deletePo(Long id) {
        poRepository.deleteById(id);
    }
}
