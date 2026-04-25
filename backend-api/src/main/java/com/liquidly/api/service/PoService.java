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

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist a purchase order (PO) record.
    public Po createPo(Po po) {
        if (po == null) {
            throw new RuntimeException("PO is required");
        }
        po.setCompany(authenticatedUserService.getRequiredCompany());
        return poRepository.save(po);
    }

    // Return all PO records.
    public List<Po> getAllPos() {
        return poRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return PO records filtered by company id.
    public List<Po> getPosByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return poRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return PO records filtered by PO number.
    public List<Po> getPosByPoNumber(String poNumber) {
        return poRepository.findByPoNumber(poNumber);
    }

    // Return a PO record by id.
    public Po getPoById(Long id) {
        return getPoByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete a PO record by id.
    public void deletePo(Long id) {
        poRepository.delete(getPoByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    public Po getPoByIdForCompany(Long id, Long companyId) {
        return poRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("PO not found with id: " + id));
    }
}
