package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.model.Company;
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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.transaction.support.TransactionTemplate;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class LiquidationResultServiceTest {

    @Mock
    private LiquidationResultRepository liquidationResultRepository;

    @Mock
    private BomRepository bomRepository;

    @Mock
    private InvoiceRepository invoiceRepository;

    @Mock
    private PoRepository poRepository;

    @Mock
    private ConversionRepository conversionRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @Mock
    private ReportJobService reportJobService;

    @Mock
    private TransactionTemplate transactionTemplate;

    @Mock
    private ReportExcelService reportExcelService;

    @InjectMocks
    private LiquidationResultService liquidationResultService;

    @Test
    void shouldNotGenerateResultsOrConsumePoWithoutMatchingInvoice() {
        Long companyId = 1L;
        Long projectId = 10L;

        Project project = new Project();
        project.setId(projectId);
        project.setName("Projeto Teste");

        Company company = new Company();
        company.setId(companyId);

        Bom bom = new Bom();
        bom.setId(100L);
        bom.setCompany(company);
        bom.setProject(project);
        bom.setProjectName("Projeto Teste");
        bom.setItemCode("ITEM-X");
        bom.setItemName("Item X");
        bom.setQntd(new BigDecimal("10"));
        bom.setUmBom("UN");
        bom.setRemainingQntd(BigDecimal.ZERO);

        Invoice unrelatedInvoice = new Invoice();
        unrelatedInvoice.setId(200L);
        unrelatedInvoice.setCompany(company);
        unrelatedInvoice.setProject(project);
        unrelatedInvoice.setItemCode("ITEM-Y");
        unrelatedInvoice.setInvoiceNumber("NF-1");
        unrelatedInvoice.setCountry("BR");
        unrelatedInvoice.setInvoiceDateString("2026-05-01");
        unrelatedInvoice.setInvoiceValue(new BigDecimal("100"));
        unrelatedInvoice.setQntdInvoice(new BigDecimal("10"));
        unrelatedInvoice.setUmInvoice("UN");
        unrelatedInvoice.setRemainingQntd(BigDecimal.ZERO);

        Po po = new Po();
        po.setId(300L);
        po.setCompany(company);
        po.setPoNumber("PO-1");
        po.setItemCode("ITEM-X");
        po.setPoValue(new BigDecimal("50"));
        po.setQntdInvoice(new BigDecimal("10"));
        po.setUmPo("UN");
        po.setRemainingQntd(BigDecimal.ZERO);

        List<LiquidationResult> persistedResults = new ArrayList<>();

        when(authenticatedUserService.validateAndResolveCompanyId(companyId)).thenReturn(companyId);
        when(projectRepository.findByIdAndCompanyId(projectId, companyId)).thenReturn(Optional.of(project));
        when(bomRepository.findByCompanyIdAndProjectId(companyId, projectId)).thenReturn(new ArrayList<>(List.of(bom)));
        when(invoiceRepository.findByCompanyIdAndProjectId(companyId, projectId)).thenReturn(new ArrayList<>(List.of(unrelatedInvoice)));
        when(poRepository.findByCompanyId(companyId)).thenReturn(new ArrayList<>(List.of(po)));
        when(liquidationResultRepository.findByCompanyIdAndProjectIdOrderByIdAsc(companyId, projectId)).thenAnswer(invocation -> persistedResults);
        when(liquidationResultRepository.saveAllAndFlush(any())).thenAnswer(invocation -> {
            persistedResults.clear();
            Iterable<LiquidationResult> saved = invocation.getArgument(0);
            saved.forEach(persistedResults::add);
            return persistedResults;
        });
        when(bomRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(invoiceRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        when(poRepository.saveAll(any())).thenAnswer(invocation -> invocation.getArgument(0));
        doNothing().when(liquidationResultRepository).deleteByCompanyIdAndProjectId(companyId, projectId);

        List<LiquidationResult> results = liquidationResultService.runLiquidation(companyId, projectId);

        assertTrue(results.isEmpty());
        assertEquals(new BigDecimal("10"), bom.getRemainingQntd());
        assertEquals(new BigDecimal("10"), po.getRemainingQntd());
        assertEquals(new BigDecimal("10"), unrelatedInvoice.getRemainingQntd());

        ArgumentCaptor<Iterable<LiquidationResult>> resultsCaptor = ArgumentCaptor.forClass(Iterable.class);
        verify(liquidationResultRepository).saveAllAndFlush(resultsCaptor.capture());
        assertTrue(toList(resultsCaptor.getValue()).isEmpty());

        verify(bomRepository).saveAll(any());
        verify(invoiceRepository).saveAll(any());
        verify(poRepository).saveAll(any());
        verify(projectRepository).findByIdAndCompanyId(projectId, companyId);
        verify(bomRepository).findByCompanyIdAndProjectId(companyId, projectId);
        verify(invoiceRepository).findByCompanyIdAndProjectId(companyId, projectId);
        verify(poRepository).findByCompanyId(companyId);
        verify(authenticatedUserService).validateAndResolveCompanyId(companyId);
        verify(liquidationResultRepository).findByCompanyIdAndProjectIdOrderByIdAsc(eq(companyId), eq(projectId));
    }

    private List<LiquidationResult> toList(Iterable<LiquidationResult> results) {
        List<LiquidationResult> list = new ArrayList<>();
        results.forEach(list::add);
        return list;
    }
}
