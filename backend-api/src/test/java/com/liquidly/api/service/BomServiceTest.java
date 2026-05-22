package com.liquidly.api.service;

import com.liquidly.api.dto.CreateBomRequest;
import com.liquidly.api.model.Company;
import com.liquidly.api.model.Project;
import com.liquidly.api.repository.BomRepository;
import com.liquidly.api.repository.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class BomServiceTest {

    @Mock
    private BomRepository bomRepository;

    @Mock
    private ProjectRepository projectRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private BomService bomService;

    @Test
    void shouldCreateBomOnlyForAuthenticatedCompanyProject() {
        var company = new Company();
        company.setId(10L);

        var project = new Project();
        project.setId(7L);
        project.setName("Projeto A");

        var request = new CreateBomRequest();
        request.setProjectId(7L);
        request.setProjectName("Projeto A");
        request.setItemCode("ITEM-1");
        request.setItemName("Parafuso");
        request.setUmBom("PC");
        request.setQntd(new BigDecimal("5.0"));

        when(authenticatedUserService.getRequiredCompanyId()).thenReturn(10L);
        when(authenticatedUserService.getRequiredCompany()).thenReturn(company);
        when(projectRepository.findByIdAndCompanyId(7L, 10L)).thenReturn(Optional.of(project));
        when(bomRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        var created = bomService.createBom(request);

        assertEquals(7L, created.getProject().getId());
        assertEquals(10L, created.getCompany().getId());
        assertEquals(new BigDecimal("5.0"), created.getRemainingQntd());
        verify(projectRepository).findByIdAndCompanyId(7L, 10L);
    }

    @Test
    void shouldRejectBomCreationWhenProjectDoesNotBelongToAuthenticatedCompany() {
        var request = new CreateBomRequest();
        request.setProjectId(99L);
        request.setProjectName("Projeto B");
        request.setItemCode("ITEM-2");
        request.setItemName("Porca");
        request.setUmBom("PC");
        request.setQntd(new BigDecimal("3.0"));

        when(authenticatedUserService.getRequiredCompanyId()).thenReturn(10L);
        when(projectRepository.findByIdAndCompanyId(99L, 10L)).thenReturn(Optional.empty());

        var ex = assertThrows(RuntimeException.class, () -> bomService.createBom(request));

        assertEquals("Project not found with id: 99", ex.getMessage());
    }
}
