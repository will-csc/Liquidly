package com.liquidly.api.service;

import com.liquidly.api.model.Conversion;
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

    // Persist a conversion record.
    public Conversion createConversion(Conversion conversion) {
        return conversionRepository.save(conversion);
    }

    // Update an existing conversion entry while preserving company when omitted.
    public Conversion updateConversion(Long id, Conversion conversion) {
        Conversion existing = getConversionById(id);

        if (conversion == null) {
            throw new RuntimeException("Conversion is required");
        }

        existing.setItemCode(conversion.getItemCode());
        existing.setQntdInvoice(conversion.getQntdInvoice() == null ? BigDecimal.ZERO : conversion.getQntdInvoice());
        existing.setUmInvoice(conversion.getUmInvoice());
        existing.setQntdBom(conversion.getQntdBom() == null ? BigDecimal.ZERO : conversion.getQntdBom());
        existing.setUmBom(conversion.getUmBom());

        if (conversion.getCompany() != null && conversion.getCompany().getId() != null) {
            existing.setCompany(conversion.getCompany());
        }

        return conversionRepository.save(existing);
    }

    // Return all conversion records.
    public List<Conversion> getAllConversions() {
        return conversionRepository.findAll();
    }

    // Return conversion records filtered by company id.
    public List<Conversion> getConversionsByCompanyId(Long companyId) {
        return conversionRepository.findByCompanyId(companyId);
    }

    // Return a conversion record by item code and company id.
    public Optional<Conversion> getConversionByItemCodeAndCompanyId(String itemCode, Long companyId) {
        return conversionRepository.findByItemCodeAndCompanyId(itemCode, companyId);
    }

    // Return a conversion record by id.
    public Conversion getConversionById(Long id) {
        return conversionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversion not found with id: " + id));
    }

    // Delete a conversion record by id.
    public void deleteConversion(Long id) {
        conversionRepository.deleteById(id);
    }
}
