package com.liquidly.api.controller;

import com.liquidly.api.model.Conversion;
import com.liquidly.api.service.ConversionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/conversions")
@CrossOrigin(origins = "*")
public class ConversionController {

    @Autowired
    private ConversionService conversionService;

    @PostMapping
    public ResponseEntity<Conversion> createConversion(@RequestBody Conversion conversion) {
        return ResponseEntity.ok(conversionService.createConversion(conversion));
    }

    @GetMapping
    public ResponseEntity<List<Conversion>> getAllConversions() {
        return ResponseEntity.ok(conversionService.getAllConversions());
    }

    @GetMapping("/company/{companyId}")
    public ResponseEntity<List<Conversion>> getConversionsByCompanyId(@PathVariable Long companyId) {
        return ResponseEntity.ok(conversionService.getConversionsByCompanyId(companyId));
    }

    @GetMapping("/company/{companyId}/item/{itemCode}")
    public ResponseEntity<Conversion> getConversionByItemCodeAndCompanyId(
            @PathVariable Long companyId,
            @PathVariable String itemCode) {
        return conversionService.getConversionByItemCodeAndCompanyId(itemCode, companyId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/{id}")
    public ResponseEntity<Conversion> getConversionById(@PathVariable Long id) {
        return ResponseEntity.ok(conversionService.getConversionById(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteConversion(@PathVariable Long id) {
        conversionService.deleteConversion(id);
        return ResponseEntity.noContent().build();
    }
}
