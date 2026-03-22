package com.liquidly.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// JPA entity representing one row of the liquidation report (BOM vs invoice/PO consumption).
@Entity
@Table(name = "liquidation_results")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class LiquidationResult {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "company_id")
    private Company company;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "project_name", nullable = false)
    private String projectName;

    @Column(nullable = false)
    private String item;

    // BOM Details
    @Column(name = "qntd_bom", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdBom;

    @Column(name = "um_bom", nullable = false)
    private String umBom;

    @Column(name = "qntd_consumed_bom", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdConsumedBom;

    @Column(name = "remaining_qntd", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntd;

    // Invoice Details
    @Column(name = "invoice_number")
    private String invoiceNumber;

    @Column(name = "qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdInvoice;

    @Column(name = "um_invoice")
    private String umInvoice;

    @Column(name = "qntd_consumed_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdConsumedInvoice;

    @Column(name = "remaining_qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntdInvoice;

    // PO Details
    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "qntd_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdPo;

    @Column(name = "um_po")
    private String umPo;

    @Column(name = "qntd_consumed_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdConsumedPo;

    @Column(name = "remaining_qntd_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntdPo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    // Set the creation timestamp automatically when the record is first persisted.
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
