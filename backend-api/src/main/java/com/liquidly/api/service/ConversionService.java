package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.model.Conversion;
import com.liquidly.api.repository.BomRepository;
import com.liquidly.api.repository.ConversionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Service
public class ConversionService {

    @Autowired
    private ConversionRepository conversionRepository;

    @Autowired
    private BomRepository bomRepository;

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    // Persist a conversion record.
    public Conversion createConversion(Conversion conversion) {
        Long companyId = authenticatedUserService.getRequiredCompanyId();
        validateConversionAgainstBom(conversion, companyId);
        conversion.setCompany(authenticatedUserService.getRequiredCompany());
        return conversionRepository.save(conversion);
    }

    // Update an existing conversion entry while preserving company when omitted.
    public Conversion updateConversion(Long id, Conversion conversion) {
        Long companyId = authenticatedUserService.getRequiredCompanyId();
        Conversion existing = getConversionByIdForCompany(id, companyId);

        if (conversion == null) {
            throw new RuntimeException("Conversion is required");
        }

        validateConversionAgainstBom(conversion, companyId);

        existing.setItemCode(conversion.getItemCode());
        existing.setQntdInvoice(conversion.getQntdInvoice() == null ? BigDecimal.ZERO : conversion.getQntdInvoice());
        existing.setUmInvoice(conversion.getUmInvoice());
        existing.setQntdBom(conversion.getQntdBom() == null ? BigDecimal.ZERO : conversion.getQntdBom());
        existing.setUmBom(conversion.getUmBom());

        existing.setCompany(authenticatedUserService.getRequiredCompany());

        return conversionRepository.save(existing);
    }

    // Return all conversion records.
    public List<Conversion> getAllConversions() {
        return conversionRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return conversion records filtered by company id.
    public List<Conversion> getConversionsByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return conversionRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return a conversion record by item code and company id.
    public Optional<Conversion> getConversionByItemCodeAndCompanyId(String itemCode, Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return conversionRepository.findByItemCodeAndCompanyId(itemCode, resolvedCompanyId);
    }

    // Return a conversion record by id.
    public Conversion getConversionById(Long id) {
        return getConversionByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete a conversion record by id.
    public void deleteConversion(Long id) {
        conversionRepository.delete(getConversionByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    private void validateConversionAgainstBom(Conversion conversion, Long companyId) {
        if (conversion == null) {
            throw new RuntimeException("Conversion is required");
        }

        String itemCode = conversion.getItemCode() == null ? "" : conversion.getItemCode().trim();
        if (itemCode.isEmpty() || companyId == null) {
            return;
        }

        boolean existsInBom = bomRepository.findByCompanyId(companyId).stream()
                .map(Bom::getItemCode)
                .filter(code -> code != null && !code.trim().isEmpty())
                .anyMatch(code -> code.trim().equalsIgnoreCase(itemCode));

        if (!existsInBom) {
            throw new RuntimeException("This item_code does not exist in the company BOM");
        }
    }

    public Conversion getConversionByIdForCompany(Long id, Long companyId) {
        return conversionRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Conversion not found with id: " + id));
    }
}
