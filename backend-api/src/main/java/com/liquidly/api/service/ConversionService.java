package com.liquidly.api.service;

import com.liquidly.api.model.Conversion;
import com.liquidly.api.repository.ConversionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class ConversionService {

    @Autowired
    private ConversionRepository conversionRepository;

    public Conversion createConversion(Conversion conversion) {
        return conversionRepository.save(conversion);
    }

    public List<Conversion> getAllConversions() {
        return conversionRepository.findAll();
    }

    public List<Conversion> getConversionsByCompanyId(Long companyId) {
        return conversionRepository.findByCompanyId(companyId);
    }

    public Optional<Conversion> getConversionByItemCodeAndCompanyId(String itemCode, Long companyId) {
        return conversionRepository.findByItemCodeAndCompanyId(itemCode, companyId);
    }

    public Conversion getConversionById(Long id) {
        return conversionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Conversion not found with id: " + id));
    }

    public void deleteConversion(Long id) {
        conversionRepository.deleteById(id);
    }
}
