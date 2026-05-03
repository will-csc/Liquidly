package com.liquidly.api.service;

import com.liquidly.api.dto.ReportJobStartResponse;
import com.liquidly.api.dto.ReportJobStatusResponse;
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
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CompletableFuture;

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

    @Autowired
    private AuthenticatedUserService authenticatedUserService;

    @Autowired
    private ReportJobService reportJobService;

    @Autowired
    private TransactionTemplate transactionTemplate;

    @Autowired
    private ReportExcelService reportExcelService;

    // Persist a liquidation result record.
    public LiquidationResult createLiquidationResult(LiquidationResult result) {
        return liquidationResultRepository.save(result);
    }

    // Return all liquidation results.
    public List<LiquidationResult> getAllLiquidationResults() {
        return liquidationResultRepository.findByCompanyId(authenticatedUserService.getRequiredCompanyId());
    }

    // Return liquidation results filtered by company id.
    public List<LiquidationResult> getLiquidationResultsByCompanyId(Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return liquidationResultRepository.findByCompanyId(resolvedCompanyId);
    }

    // Return liquidation results filtered by project id.
    public List<LiquidationResult> getLiquidationResultsByProjectId(Long projectId) {
        return liquidationResultRepository.findByProjectIdAndCompanyId(projectId, authenticatedUserService.getRequiredCompanyId());
    }

    // Return a liquidation result by id.
    public LiquidationResult getLiquidationResultById(Long id) {
        return getLiquidationResultByIdForCompany(id, authenticatedUserService.getRequiredCompanyId());
    }

    // Delete a liquidation result by id.
    public void deleteLiquidationResult(Long id) {
        liquidationResultRepository.delete(getLiquidationResultByIdForCompany(id, authenticatedUserService.getRequiredCompanyId()));
    }

    public ReportJobStartResponse startReportJob(
            Long companyId,
            Long projectId,
            String selectedBom,
            String startDate,
            String endDate
    ) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        if (resolvedCompanyId == null || projectId == null) {
            throw new RuntimeException("companyId and projectId are required");
        }

        ReportJobStartResponse job = reportJobService.createJob(resolvedCompanyId, projectId);
        CompletableFuture.runAsync(() -> {
            try {
                reportJobService.update(job.getJobId(), 5, "running", "Validando", "Validando os dados do relatório.");
                List<LiquidationResult> results = transactionTemplate.execute((status) ->
                        runLiquidationValidated(resolvedCompanyId, projectId, (progress, stage, message) ->
                                reportJobService.update(job.getJobId(), progress, "running", stage, message)
                        )
                );
                if (results == null) {
                    throw new RuntimeException("Nao foi possivel gerar os dados do relatorio.");
                }
                reportJobService.update(job.getJobId(), 88, "running", "Preparando arquivo", "Gerando o arquivo Excel para download.");
                ReportExcelService.GeneratedReport generatedReport = reportExcelService.buildLiquidationReport(
                        resolvedCompanyId,
                        projectId,
                        selectedBom,
                        startDate,
                        endDate,
                        results
                );
                reportJobService.complete(
                        job.getJobId(),
                        "Relatório concluído. O download está disponível.",
                        generatedReport.content(),
                        generatedReport.filename(),
                        generatedReport.contentType()
                );
            } catch (Exception ex) {
                String message = ex.getMessage() == null || ex.getMessage().isBlank()
                        ? "Não foi possível concluir o relatório."
                        : ex.getMessage();
                reportJobService.fail(job.getJobId(), message);
            }
        });
        return job;
    }

    public ReportJobStatusResponse getReportJobStatus(String jobId, Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return reportJobService.getJob(jobId, resolvedCompanyId);
    }

    public ReportJobService.ReportFile getReportJobFile(String jobId, Long companyId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return reportJobService.getReportFile(jobId, resolvedCompanyId);
    }

    @Transactional
    // Run liquidation for a company/project by consuming invoices and POs against BOM requirements.
    public List<LiquidationResult> runLiquidation(Long companyId, Long projectId) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return runLiquidationValidated(resolvedCompanyId, projectId, null);
    }

    @Transactional
    public List<LiquidationResult> runLiquidation(Long companyId, Long projectId, ReportProgressListener progressListener) {
        Long resolvedCompanyId = authenticatedUserService.validateAndResolveCompanyId(companyId);
        return runLiquidationValidated(resolvedCompanyId, projectId, progressListener);
    }

    private List<LiquidationResult> runLiquidationValidated(Long resolvedCompanyId, Long projectId, ReportProgressListener progressListener) {
        if (resolvedCompanyId == null || projectId == null) {
            throw new RuntimeException("companyId and projectId are required");
        }

        Project project = requireProjectInCompany(projectId, resolvedCompanyId);
        notifyProgress(progressListener, 10, "Carregando dados", "Carregando BOM, invoices e POs.");

        // Clear previous results for the same company/project to keep the run idempotent.
        liquidationResultRepository.deleteByCompanyIdAndProjectId(resolvedCompanyId, projectId);

        // Load input data for the liquidation run.
        List<Bom> boms = bomRepository.findByCompanyIdAndProjectId(resolvedCompanyId, projectId);
        List<Invoice> invoices = invoiceRepository.findByCompanyIdAndProjectId(resolvedCompanyId, projectId);
        List<Po> pos = poRepository.findByCompanyId(resolvedCompanyId);

        if (invoices.isEmpty()) {
            throw new RuntimeException("Cannot run report without NFs for the selected project");
        }
        if (pos.isEmpty()) {
            throw new RuntimeException("Cannot run report without POs for the company");
        }
        if (boms.isEmpty()) {
            throw new RuntimeException("Cannot run report without BOM data for the selected project");
        }

        notifyProgress(progressListener, 18, "Preparando liquidação", "Preparando os dados para processar a liquidação.");

        // Initialize remaining quantities if missing.
        for (Bom b : boms) {
            if (isNullOrZero(b.getRemainingQntd())) b.setRemainingQntd(nz(b.getQntd()));
        }
        for (Invoice i : invoices) {
            if (isNullOrZero(i.getRemainingQntd())) i.setRemainingQntd(nz(i.getQntdInvoice()));
        }
        for (Po p : pos) {
            if (isNullOrZero(p.getRemainingQntd())) p.setRemainingQntd(nz(p.getQntdInvoice()));
        }

        // Sort invoices and POs to prioritize the newest records first.
        invoices.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() != null) return 1;
            if (a.getCreatedAt() != null && b.getCreatedAt() == null) return -1;
            if (a.getCreatedAt() != null) {
                int cmp = b.getCreatedAt().compareTo(a.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            return Long.compare(nzId(b.getId()), nzId(a.getId()));
        });

        pos.sort((a, b) -> {
            if (a.getCreatedAt() == null && b.getCreatedAt() != null) return 1;
            if (a.getCreatedAt() != null && b.getCreatedAt() == null) return -1;
            if (a.getCreatedAt() != null) {
                int cmp = b.getCreatedAt().compareTo(a.getCreatedAt());
                if (cmp != 0) return cmp;
            }
            return Long.compare(nzId(b.getId()), nzId(a.getId()));
        });

        List<LiquidationResult> results = new ArrayList<>();
        String fallbackProjectName = project.getName() == null ? "" : project.getName();

        // Main liquidation loop: consume invoice quantities first, then PO quantities, updating remaining balances.
        int totalBoms = Math.max(1, boms.size());
        for (int bomIndex = 0; bomIndex < boms.size(); bomIndex++) {
            Bom bom = boms.get(bomIndex);
            BigDecimal bomRemaining = nz(bom.getRemainingQntd());
            if (bomRemaining.signum() <= 0) {
                notifyLiquidationProgress(progressListener, bomIndex + 1, totalBoms);
                continue;
            }
            String bomItemCode = normalize(bom.getItemCode());

            for (Invoice inv : invoices) {
                BigDecimal invRemaining = nz(inv.getRemainingQntd());
                if (invRemaining.signum() <= 0) continue;
                if (!bomItemCode.equals(normalize(inv.getItemCode()))) continue;

                // Convert invoice UM -> BOM UM using the latest conversion factor for the item.
                BigDecimal factor = getFactor(resolvedCompanyId, bom.getItemCode(), inv.getUmInvoice(), bom.getUmBom());
                if (factor == null || factor.signum() == 0) {
                    results.add(buildResult(resolvedCompanyId, projectId, fallbackProjectName, bom, bomRemaining, inv, invRemaining, BigDecimal.ZERO, BigDecimal.ZERO, null, BigDecimal.ZERO, BigDecimal.ZERO));
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

                results.add(buildResult(resolvedCompanyId, projectId, fallbackProjectName, bom, bomRemaining, inv, invRemaining, consumedBom, consumedInv, null, BigDecimal.ZERO, BigDecimal.ZERO));

                if (bomRemaining.signum() <= 0) break;
            }

            if (bomRemaining.signum() <= 0) {
                notifyLiquidationProgress(progressListener, bomIndex + 1, totalBoms);
                continue;
            }

            for (Po po : pos) {
                BigDecimal poRemaining = nz(po.getRemainingQntd());
                if (poRemaining.signum() <= 0) continue;
                if (!bomItemCode.equals(normalize(po.getItemCode()))) continue;

                // Convert PO UM -> BOM UM using the latest conversion factor for the item.
                BigDecimal factor = getFactor(resolvedCompanyId, bom.getItemCode(), po.getUmPo(), bom.getUmBom());
                if (factor == null || factor.signum() == 0) {
                    results.add(buildResult(resolvedCompanyId, projectId, fallbackProjectName, bom, bomRemaining, null, BigDecimal.ZERO, BigDecimal.ZERO, BigDecimal.ZERO, po, poRemaining, BigDecimal.ZERO));
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

                results.add(buildResult(resolvedCompanyId, projectId, fallbackProjectName, bom, bomRemaining, null, BigDecimal.ZERO, consumedBom, BigDecimal.ZERO, po, poRemaining, consumedPo));

                if (bomRemaining.signum() <= 0) break;
            }
            notifyLiquidationProgress(progressListener, bomIndex + 1, totalBoms);
        }

        // Persist remaining quantities back into source tables and store the generated results.
        notifyProgress(progressListener, 82, "Salvando dados", "Salvando os resultados e saldos processados.");
        bomRepository.saveAll(boms);
        invoiceRepository.saveAll(invoices);
        if (!pos.isEmpty()) poRepository.saveAll(pos);

        notifyProgress(progressListener, 86, "Persistindo relatório", "Persistindo os resultados finais do relatório.");
        return liquidationResultRepository.saveAll(results);
    }

    public LiquidationResult getLiquidationResultByIdForCompany(Long id, Long companyId) {
        return liquidationResultRepository.findByIdAndCompanyId(id, companyId)
                .orElseThrow(() -> new RuntimeException("Liquidation Result not found with id: " + id));
    }

    private Project requireProjectInCompany(Long projectId, Long companyId) {
        return projectRepository.findByIdAndCompanyId(projectId, companyId)
                .orElseThrow(() -> new RuntimeException("Project not found with id: " + projectId));
    }

    private void notifyLiquidationProgress(ReportProgressListener progressListener, int completedItems, int totalItems) {
        int progress = 20 + (int) Math.round((completedItems * 60.0) / Math.max(1, totalItems));
        String message = String.format("Processando itens da BOM (%d de %d).", completedItems, totalItems);
        notifyProgress(progressListener, progress, "Processando liquidação", message);
    }

    private void notifyProgress(ReportProgressListener progressListener, int progress, String stage, String message) {
        if (progressListener != null) {
            progressListener.update(progress, stage, message);
        }
    }

    @FunctionalInterface
    public interface ReportProgressListener {
        void update(int progress, String stage, String message);
    }

    // Resolve the latest unit conversion factor for an item within a company.
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

    // Extract a conversion factor from a conversion record (explicit factor or derived from quantities).
    private BigDecimal extractFactor(Conversion c) {
        if (c.getConversionFactor() != null) return c.getConversionFactor();
        BigDecimal invoice = nz(c.getQntdInvoice());
        if (invoice.signum() == 0) return null;
        return nz(c.getQntdBom()).divide(invoice, 12, RoundingMode.HALF_UP);
    }

    // Build a result row for the liquidation report, linking company/project and optional invoice/PO references.
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
            BigDecimal invoiceValue = nz(invoice.getInvoiceValue());
            BigDecimal invoiceQty = nz(invoice.getQntdInvoice());
            r.setInvoiceNumber(invoice.getInvoiceNumber());
            r.setInvoiceCountry(safeString(invoice.getCountry()));
            r.setInvoiceDateString(safeString(invoice.getInvoiceDateString()));
            r.setInvoiceValue(moneyRound(invoiceValue));
            r.setQntdInvoice(invoiceQty);
            r.setUmInvoice(invoice.getUmInvoice());
            r.setConsumedInvoiceValue(proportionalValue(invoiceValue, invoiceQty, consumedInvoice));
            r.setQntdConsumedInvoice(nz(consumedInvoice));
            r.setRemainingInvoiceValue(proportionalValue(invoiceValue, invoiceQty, invoiceRemaining));
            r.setRemainingQntdInvoice(nz(invoiceRemaining));
        } else {
            r.setInvoiceNumber(null);
            r.setInvoiceCountry("");
            r.setInvoiceDateString("");
            r.setInvoiceValue(BigDecimal.ZERO);
            r.setQntdInvoice(BigDecimal.ZERO);
            r.setUmInvoice(null);
            r.setConsumedInvoiceValue(BigDecimal.ZERO);
            r.setQntdConsumedInvoice(BigDecimal.ZERO);
            r.setRemainingInvoiceValue(BigDecimal.ZERO);
            r.setRemainingQntdInvoice(BigDecimal.ZERO);
        }

        if (po != null) {
            BigDecimal poValue = nz(po.getPoValue());
            BigDecimal poQty = nz(po.getQntdInvoice());
            r.setPoNumber(po.getPoNumber());
            r.setPoValue(moneyRound(poValue));
            r.setQntdPo(poQty);
            r.setUmPo(po.getUmPo());
            r.setConsumedPoValue(proportionalValue(poValue, poQty, consumedPo));
            r.setQntdConsumedPo(nz(consumedPo));
            r.setRemainingPoValue(proportionalValue(poValue, poQty, poRemaining));
            r.setRemainingQntdPo(nz(poRemaining));
        } else {
            r.setPoNumber(null);
            r.setPoValue(BigDecimal.ZERO);
            r.setQntdPo(BigDecimal.ZERO);
            r.setUmPo(null);
            r.setConsumedPoValue(BigDecimal.ZERO);
            r.setQntdConsumedPo(BigDecimal.ZERO);
            r.setRemainingPoValue(BigDecimal.ZERO);
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

    private BigDecimal proportionalValue(BigDecimal totalValue, BigDecimal totalQty, BigDecimal partialQty) {
        BigDecimal safeTotalValue = nz(totalValue);
        BigDecimal safeTotalQty = nz(totalQty);
        BigDecimal safePartialQty = nz(partialQty);
        if (safeTotalValue.signum() == 0 || safeTotalQty.signum() == 0 || safePartialQty.signum() == 0) {
            return BigDecimal.ZERO;
        }

        BigDecimal unitValue = safeTotalValue.divide(safeTotalQty, 12, RoundingMode.HALF_UP);
        return moneyRound(unitValue.multiply(safePartialQty));
    }

    private BigDecimal moneyRound(BigDecimal v) {
        if (v == null) return BigDecimal.ZERO;
        return v.setScale(2, RoundingMode.HALF_UP);
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

    private String safeString(String s) {
        return s == null ? "" : s;
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
}
