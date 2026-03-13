package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.model.Company;
import com.liquidly.api.model.Conversion;
import com.liquidly.api.model.Invoice;
import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.model.Po;
import com.liquidly.api.model.Project;
import com.liquidly.api.repository.BomRepository;
import com.liquidly.api.repository.ConversionRepository;
import com.liquidly.api.repository.InvoiceRepository;
import com.liquidly.api.repository.LiquidationResultRepository;
import com.liquidly.api.repository.PoRepository;
import com.liquidly.api.repository.ProjectRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class LiquidationResultService {

    @Autowired
    private LiquidationResultRepository liquidationResultRepository;

    @Autowired
    private BomRepository bomRepository;

    @Autowired
    private InvoiceRepository invoiceRepository;

    @Autowired
    private PoRepository poRepository;

    @Autowired
    private ConversionRepository conversionRepository;

    @Autowired
    private ProjectRepository projectRepository;

    @Value("${email.service.url:http://localhost:5000}")
    private String emailServiceUrl;

    @Value("${email.service.backupUrl:http://localhost:5000}")
    private String emailServiceBackupUrl;

    @Value("${email.service.apiKey:}")
    private String emailServiceApiKey;

    public LiquidationResult createLiquidationResult(LiquidationResult result) {
        return liquidationResultRepository.save(result);
    }

    public List<LiquidationResult> getAllLiquidationResults() {
        return liquidationResultRepository.findAll();
    }

    public List<LiquidationResult> getLiquidationResultsByCompanyId(Long companyId) {
        return liquidationResultRepository.findByCompanyId(companyId);
    }

    public List<LiquidationResult> getLiquidationResultsByProjectId(Long projectId) {
        return liquidationResultRepository.findByProjectId(projectId);
    }

    public LiquidationResult getLiquidationResultById(Long id) {
        return liquidationResultRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Liquidation Result not found with id: " + id));
    }

    public void deleteLiquidationResult(Long id) {
        liquidationResultRepository.deleteById(id);
    }

    public void sendReportEmail(
            Long companyId,
            Long projectId,
            String toEmail,
            String selectedBom,
            String startDate,
            String endDate
    ) {
        if (companyId == null || projectId == null) {
            throw new RuntimeException("companyId and projectId are required");
        }
        if (toEmail == null || toEmail.trim().isEmpty()) {
            throw new RuntimeException("Email is required");
        }

        String bomIdJson = "null";
        if (selectedBom != null && !selectedBom.trim().isEmpty() && !"all".equalsIgnoreCase(selectedBom.trim())) {
            String raw = selectedBom.trim();
            if (raw.matches("\\d+")) {
                bomIdJson = raw;
            }
        }

        String startJson = (startDate == null || startDate.trim().isEmpty()) ? "null" : "\"" + escapeJson(startDate.trim()) + "\"";
        String endJson = (endDate == null || endDate.trim().isEmpty()) ? "null" : "\"" + escapeJson(endDate.trim()) + "\"";

        String jsonBody = "{"
                + "\"to\":\"" + escapeJson(toEmail.trim()) + "\","
                + "\"companyId\":" + companyId + ","
                + "\"projectId\":" + projectId + ","
                + "\"bomId\":" + bomIdJson + ","
                + "\"startDate\":" + startJson + ","
                + "\"endDate\":" + endJson + ","
                + "\"subject\":\"" + escapeJson("Liquidly Report") + "\","
                + "\"filename\":\"" + escapeJson("liquidly_report.xlsx") + "\""
                + "}";

        List<String> serviceUrls = new ArrayList<>();
        if (emailServiceUrl != null && !emailServiceUrl.trim().isEmpty()) {
            serviceUrls.add(emailServiceUrl.trim());
        }
        if (emailServiceBackupUrl != null && !emailServiceBackupUrl.trim().isEmpty()) {
            String backup = emailServiceBackupUrl.trim();
            if (serviceUrls.isEmpty() || !backup.equals(serviceUrls.get(0))) {
                serviceUrls.add(backup);
            }
        }

        RuntimeException lastError = null;
        for (String serviceUrl : serviceUrls) {
            String endpoint = serviceUrl.endsWith("/")
                    ? serviceUrl + "send-report"
                    : serviceUrl + "/send-report";

            HttpRequest.Builder requestBuilder = HttpRequest.newBuilder()
                    .uri(URI.create(endpoint))
                    .timeout(Duration.ofSeconds(120))
                    .header("Content-Type", "application/json")
                    .POST(HttpRequest.BodyPublishers.ofString(jsonBody));

            if (emailServiceApiKey != null && !emailServiceApiKey.trim().isEmpty()) {
                requestBuilder.header("X-API-Key", emailServiceApiKey.trim());
            }

            try {
                HttpResponse<String> response = HttpClient.newHttpClient()
                        .send(requestBuilder.build(), HttpResponse.BodyHandlers.ofString());

                int status = response.statusCode();
                if (status >= 200 && status < 300) {
                    return;
                }
                if (status >= 400 && status < 500) {
                    throw new RuntimeException("Could not send report");
                }
                lastError = new RuntimeException("Could not send report");
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
                lastError = new RuntimeException("Could not send report");
            } catch (Exception e) {
                lastError = new RuntimeException("Could not send report");
            }
        }

        if (lastError != null) throw lastError;
        throw new RuntimeException("Could not send report");
    }

    @Transactional
    public List<LiquidationResult> runLiquidation(Long companyId, Long projectId) {
        if (companyId == null || projectId == null) {
            throw new RuntimeException("companyId and projectId are required");
        }

        Project project = projectRepository.findById(projectId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));

        liquidationResultRepository.deleteByCompanyIdAndProjectId(companyId, projectId);

        List<Bom> boms = bomRepository.findByCompanyIdAndProjectId(companyId, projectId);
        List<Invoice> invoices = invoiceRepository.findByCompanyIdAndProjectId(companyId, projectId);

        Set<String> invoiceNumbers = invoices.stream()
                .map(Invoice::getInvoiceNumber)
                .filter((n) -> n != null && !n.trim().isEmpty())
                .collect(Collectors.toSet());

        List<Po> pos = invoiceNumbers.isEmpty()
                ? List.of()
                : poRepository.findByCompanyIdAndInvoiceNumberIn(companyId, invoiceNumbers);

        for (Bom b : boms) {
            if (isNullOrZero(b.getRemainingQntd())) b.setRemainingQntd(nz(b.getQntd()));
        }
        for (Invoice i : invoices) {
            if (isNullOrZero(i.getRemainingQntd())) i.setRemainingQntd(nz(i.getQntdInvoice()));
        }
        for (Po p : pos) {
            if (isNullOrZero(p.getRemainingQntd())) p.setRemainingQntd(nz(p.getQntdInvoice()));
        }

        invoices.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() != null) return 1;
            if (a.getCreatedAt() != null && b.getCreatedAt() == null) return -1;
            if (a.getCreatedAt() != null) {
                int cmp = a.getCreatedAt().compareTo(b.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            return Long.compare(nzId(a.getId()), nzId(b.getId()));
        });

        pos.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() != null) return 1;
            if (a.getCreatedAt() != null && b.getCreatedAt() == null) return -1;
            if (a.getCreatedAt() != null) {
                int cmp = a.getCreatedAt().compareTo(b.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            return Long.compare(nzId(a.getId()), nzId(b.getId()));
        });

        List<LiquidationResult> results = new ArrayList<>();
        String fallbackProjectName = project.getName() == null ? "" : project.getName();

        for (Bom bom : boms) {
            BigDecimal bomRemaining = nz(bom.getRemainingQntd());
            if (bomRemaining.signum() <= 0) continue;

            for (Invoice inv : invoices) {
                BigDecimal invRemaining = nz(inv.getRemainingQntd());
                if (invRemaining.signum() <= 0) continue;

                BigDecimal factor = getFactor(companyId, bom.getItemCode(), inv.getUmInvoice(), bom.getUmBom());
                if (factor == null || factor.signum() == 0) {
                    results.add(buildResult(companyId, projectId, fallbackProjectName, bom, bomRemaining, inv, invRemaining, BigDecimal.ZERO, BigDecimal.ZERO, null, BigDecimal.ZERO, BigDecimal.ZERO));
                    continue;
                }

                BigDecimal supplyBom = invRemaining.multiply(factor);
                BigDecimal consumedBom = min(bomRemaining, supplyBom);
                BigDecimal consumedInv = safeDivide(consumedBom, factor);

                bomRemaining = clampZero(smartRound(bomRemaining.subtract(consumedBom)));
                invRemaining = clampZero(smartRound(invRemaining.subtract(consumedInv)));

                consumedBom = smartRound(consumedBom);
                consumedInv = smartRound(consumedInv);

                bom.setRemainingQntd(bomRemaining);
                inv.setRemainingQntd(invRemaining);

                results.add(buildResult(companyId, projectId, fallbackProjectName, bom, bomRemaining, inv, invRemaining, consumedBom, consumedInv, null, BigDecimal.ZERO, BigDecimal.ZERO));

                if (bomRemaining.signum() <= 0) break;
            }

            if (bomRemaining.signum() <= 0) continue;

            for (Po po : pos) {
                BigDecimal poRemaining = nz(po.getRemainingQntd());
                if (poRemaining.signum() <= 0) continue;

                BigDecimal factor = getFactor(companyId, bom.getItemCode(), po.getUmPo(), bom.getUmBom());
                if (factor == null || factor.signum() == 0) {
                    results.add(buildResult(companyId, projectId, fallbackProjectName, bom, bomRemaining, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, po, poRemaining, BigDecimal.ZERO));
                    continue;
                }

                BigDecimal supplyBom = poRemaining.multiply(factor);
                BigDecimal consumedBom = min(bomRemaining, supplyBom);
                BigDecimal consumedPo = safeDivide(consumedBom, factor);

                bomRemaining = clampZero(smartRound(bomRemaining.subtract(consumedBom)));
                poRemaining = clampZero(smartRound(poRemaining.subtract(consumedPo)));

                consumedBom = smartRound(consumedBom);
                consumedPo = smartRound(consumedPo);

                bom.setRemainingQntd(bomRemaining);
                po.setRemainingQntd(poRemaining);

                results.add(buildResult(companyId, projectId, fallbackProjectName, bom, bomRemaining, null, BigDecimal.ZERO, consumedBom, BigDecimal.ZERO, po, poRemaining, consumedPo));

                if (bomRemaining.signum() <= 0) break;
            }
        }

        bomRepository.saveAll(boms);
        invoiceRepository.saveAll(invoices);
        if (!pos.isEmpty()) poRepository.saveAll(pos);

        return liquidationResultRepository.saveAll(results);
    }

    private BigDecimal getFactor(Long companyId, String itemCode, String fromUm, String toUm) {
        if (fromUm == null || toUm == null) return null;
        if (normalize(fromUm).equals(normalize(toUm))) return BigDecimal.ONE;
        if (itemCode == null) return null;

        return conversionRepository
                .findTopByCompanyIdAndItemCodeIgnoreCaseAndUmInvoiceIgnoreCaseAndUmBomIgnoreCaseOrderByIdDesc(
                        companyId,
                        itemCode.trim(),
                        fromUm.trim(),
                        toUm.trim()
                )
                .map(this::extractFactor)
                .orElse(null);
    }

    private BigDecimal extractFactor(Conversion c) {
        if (c.getConversionFactor() != null) return c.getConversionFactor();
        BigDecimal invoice = nz(c.getQntdInvoice());
        if (invoice.signum() == 0) return null;
        return nz(c.getQntdBom()).divide(invoice, 12, RoundingMode.HALF_UP);
    }

    private LiquidationResult buildResult(
            Long companyId,
            Long projectId,
            String fallbackProjectName,
            Bom bom,
            BigDecimal bomRemaining,
            Invoice invoice,
            BigDecimal invoiceRemaining,
            BigDecimal consumedBom,
            BigDecimal consumedInvoice,
            Po po,
            BigDecimal poRemaining,
            BigDecimal consumedPo
    ) {
        LiquidationResult r = new LiquidationResult();

        Company c = new Company();
        c.setId(companyId);
        r.setCompany(c);

        Project p = new Project();
        p.setId(projectId);
        r.setProject(p);

        String projectName = bom.getProjectName();
        if (projectName == null || projectName.trim().isEmpty()) projectName = fallbackProjectName;
        r.setProjectName(projectName == null ? "" : projectName);

        r.setItem(bom.getItemCode());

        r.setQntdBom(nz(bom.getQntd()));
        r.setUmBom(bom.getUmBom());
        r.setQntdConsumedBom(nz(consumedBom));
        r.setRemainingQntd(nz(bomRemaining));

        if (invoice != null) {
            r.setInvoiceNumber(invoice.getInvoiceNumber());
            r.setQntdInvoice(nz(invoice.getQntdInvoice()));
            r.setUmInvoice(invoice.getUmInvoice());
            r.setQntdConsumedInvoice(nz(consumedInvoice));
            r.setRemainingQntdInvoice(nz(invoiceRemaining));
        } else {
            r.setInvoiceNumber(null);
            r.setQntdInvoice(BigDecimal.ZERO);
            r.setUmInvoice(null);
            r.setQntdConsumedInvoice(BigDecimal.ZERO);
            r.setRemainingQntdInvoice(BigDecimal.ZERO);
        }

        if (po != null) {
            r.setPoNumber(po.getInvoiceNumber());
            r.setQntdPo(nz(po.getQntdInvoice()));
            r.setUmPo(po.getUmPo());
            r.setQntdConsumedPo(nz(consumedPo));
            r.setRemainingQntdPo(nz(poRemaining));
        } else {
            r.setPoNumber(null);
            r.setQntdPo(BigDecimal.ZERO);
            r.setUmPo(null);
            r.setQntdConsumedPo(BigDecimal.ZERO);
            r.setRemainingQntdPo(BigDecimal.ZERO);
        }

        return r;
    }

    private BigDecimal min(BigDecimal a, BigDecimal b) {
        return a.compareTo(b) <= 0 ? a : b;
    }

    private BigDecimal safeDivide(BigDecimal a, BigDecimal b) {
        if (b == null || b.signum() == 0) return BigDecimal.ZERO;
        return a.divide(b, 12, RoundingMode.HALF_UP);
    }

    private BigDecimal nz(BigDecimal v) {
        return v == null ? BigDecimal.ZERO : v;
    }

    private boolean isNullOrZero(BigDecimal v) {
        return v == null || v.signum() == 0;
    }

    private String normalize(String s) {
        return s == null ? "" : s.trim().toLowerCase();
    }

    private long nzId(Long id) {
        return id == null ? 0L : id;
    }

    private BigDecimal smartRound(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        BigDecimal abs = v.abs();
        int scale = abs.compareTo(BigDecimal.ONE) < 0 ? 7 : 4;
        return v.setScale(scale, RoundingMode.HALF_UP);
    }

    private BigDecimal clampZero(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        if (v.abs().compareTo(new BigDecimal("0.000000001")) < 0) return BigDecimal.ZERO;
        if (v.signum() < 0) return BigDecimal.ZERO;
        return v;
    }

    private String escapeJson(String value) {
        if (value == null) return "";
        return value
                .replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
