package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.repository.BomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class BomService {

    @Autowired
    private BomRepository bomRepository;

    public Bom createBom(Bom bom) {
        return bomRepository.save(bom);
    }

    public List<Bom> getAllBoms() {
        return bomRepository.findAll();
    }

    public List<Bom> getBomsByCompanyId(Long companyId) {
        return bomRepository.findByCompanyId(companyId);
    }

    public List<Bom> getBomsByProjectId(Long projectId) {
        return bomRepository.findByProjectId(projectId);
    }

    public Bom getBomById(Long id) {
        return bomRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("BOM not found with id: " + id));
    }

    public void deleteBom(Long id) {
        bomRepository.deleteById(id);
    }
}
