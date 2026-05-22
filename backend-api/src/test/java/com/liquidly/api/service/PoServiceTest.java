package com.liquidly.api.service;

import com.liquidly.api.model.Po;
import com.liquidly.api.repository.PoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PoServiceTest {

    @Mock
    private PoRepository poRepository;

    @Mock
    private AuthenticatedUserService authenticatedUserService;

    @InjectMocks
    private PoService poService;

    @Test
    void shouldRestrictPoLookupByNumberToAuthenticatedCompany() {
        var po = new Po();
        po.setId(1L);
        po.setPoNumber("PO-123");

        when(authenticatedUserService.getRequiredCompanyId()).thenReturn(55L);
        when(poRepository.findByPoNumberAndCompanyId("PO-123", 55L)).thenReturn(List.of(po));

        var result = poService.getPosByPoNumber("PO-123");

        assertEquals(1, result.size());
        assertEquals("PO-123", result.get(0).getPoNumber());
        verify(poRepository).findByPoNumberAndCompanyId("PO-123", 55L);
    }
}
