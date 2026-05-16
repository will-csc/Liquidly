package com.liquidly.api.controller;

import com.liquidly.api.model.Conversion;
import com.liquidly.api.service.ConversionService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversions")
@CrossOrigin(origins = "*")
public class ConversionController {

    private static final Logger logger = LoggerFactory.getLogger(ConversionController.class);

    @Autowired
    private ConversionService conversionService;

    // Create a conversion record.
    @PostMapping
    public ResponseEntity<Conversion> createConversion(@RequestBody Conversion conversion) {
        logger.info("Recebido createConversion: itemCode={}, umInvoice={}, umBom={}",
                conversion.getItemCode(), conversion.getUmInvoice(), conversion.getUmBom());
        Conversion created = conversionService.createConversion(conversion);
        logger.info("Conversao criada: id={}, itemCode={}, factor={}",
                created.getId(), created.getItemCode(), created.getConversionFactor());
        return ResponseEntity.ok(created);
    }

    // Update an existing conversion record.
    @PutMapping("/{id}")
    public ResponseEntity<Conversion> updateConversion(@PathVariable Long id, @RequestBody Conversion conversion) {
        logger.info("Recebido updateConversion: id={}, itemCode={}", id, conversion.getItemCode());
        Conversion updated = conversionService.updateConversion(id, conversion);
        logger.info("Conversao atualizada: id={}, itemCode={}, factor={}",
                updated.getId(), updated.getItemCode(), updated.getConversionFactor());
        return ResponseEntity.ok(updated);
    }

    // Return all conversion records.
    @GetMapping
    public ResponseEntity<List<Conversion>> getAllConversions() {
        List<Conversion> conversions = conversionService.getAllConversions();
        logger.info("Listagem de conversoes concluida: total={}", conversions.size());
        return ResponseEntity.ok(conversions);
    }

    // Return conversion records filtered by company id.
    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Conversion>> getConversionsByCompanyId(@PathVariable Long companyId) {
        List<Conversion> conversions = conversionService.getConversionsByCompanyId(companyId);
        logger.info("Listagem de conversoes por company concluida: companyId={}, total={}", companyId, conversions.size());
        return ResponseEntity.ok(conversions);
    }

    // Return a single conversion record by company id and item code.
    @GetMapping("/company/{companyId}/item/{itemCode}")
    public ResponseEntity<Conversion> getConversionByItemCodeAndCompanyId(
            @PathVariable Long companyId,
            @PathVariable String itemCode) {
        logger.info("Busca de conversao por item/company: companyId={}, itemCode={}", companyId, itemCode);
        return conversionService.getConversionByItemCodeAndCompanyId(itemCode, companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    // Return a conversion record by id.
    @GetMapping("/{id}")
    public ResponseEntity<Conversion> getConversionById(@PathVariable Long id) {
        Conversion conversion = conversionService.getConversionById(id);
        logger.info("Conversao encontrada: id={}, itemCode={}", conversion.getId(), conversion.getItemCode());
        return ResponseEntity.ok(conversion);
    }

    // Delete a conversion record by id.
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversion(@PathVariable Long id) {
        logger.info("Recebido deleteConversion: id={}", id);
        conversionService.deleteConversion(id);
        logger.info("Conversao deletada: id={}", id);
        return ResponseEntity.noContent().build();
    }
}
