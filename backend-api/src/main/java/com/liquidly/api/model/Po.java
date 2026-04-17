package com.liquidly.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// JPA entity representing a purchase order (PO) line used as supply for liquidation.
@Entity
@Table(name = "pos")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Po {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "item_code", nullable = false)
    private String itemCode;

    @Column(name = "po_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal poValue;

    @Column(name = "qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdInvoice;

    @Column(name = "um_po", nullable = false)
    private String umPo;

    @Column(name = "remaining_qntd", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntd;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    // Set the creation timestamp automatically when the record is first persisted.
    protected void onCreate() {
        if (itemCode == null) itemCode = "";
        if (poValue == null) poValue = BigDecimal.ZERO;
        createdAt = LocalDateTime.now();
    }
}
