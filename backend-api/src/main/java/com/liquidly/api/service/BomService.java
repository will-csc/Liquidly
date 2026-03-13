package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.repository.BomRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class BomService {

    @Autowired
    private BomRepository bomRepository;

    public Bom createBom(Bom bom) {
        if (bom.getQntd() == null) {
            bom.setQntd(BigDecimal.ZERO);
        }

        if (bom.getRemainingQntd() == null) {
            bom.setRemainingQntd(bom.getQntd());
        }

        String projectName = bom.getProjectName();
        boolean hasProjectName = projectName != null && !projectName.trim().isEmpty();
        if (!hasProjectName) {
            String derived =
                    bom.getProject() != null && bom.getProject().getName() != null && !bom.getProject().getName().trim().isEmpty()
                            ? bom.getProject().getName().trim()
                            : "Default Project";
            bom.setProjectName(derived);
        }

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
