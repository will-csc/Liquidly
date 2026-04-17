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

    @Column(name = "invoice_country", nullable = false, length = 2)
    private String invoiceCountry;

    @Column(name = "invoice_date_string", nullable = false, length = 40)
    private String invoiceDateString;

    @Column(name = "invoice_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal invoiceValue;

    @Column(name = "qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdInvoice;

    @Column(name = "um_invoice")
    private String umInvoice;

    @Column(name = "consumed_invoice_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal consumedInvoiceValue;

    @Column(name = "qntd_consumed_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdConsumedInvoice;

    @Column(name = "remaining_invoice_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingInvoiceValue;

    @Column(name = "remaining_qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntdInvoice;

    // PO Details
    @Column(name = "po_number")
    private String poNumber;

    @Column(name = "po_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal poValue;

    @Column(name = "qntd_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdPo;

    @Column(name = "um_po")
    private String umPo;

    @Column(name = "consumed_po_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal consumedPoValue;

    @Column(name = "qntd_consumed_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdConsumedPo;

    @Column(name = "remaining_po_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal remainingPoValue;

    @Column(name = "remaining_qntd_po", nullable = false, precision = 15, scale = 4)
    private BigDecimal remainingQntdPo;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    // Set the creation timestamp automatically when the record is first persisted.
    protected void onCreate() {
        if (invoiceCountry == null) invoiceCountry = "";
        if (invoiceDateString == null) invoiceDateString = "";
        if (invoiceValue == null) invoiceValue = BigDecimal.ZERO;
        if (consumedInvoiceValue == null) consumedInvoiceValue = BigDecimal.ZERO;
        if (remainingInvoiceValue == null) remainingInvoiceValue = BigDecimal.ZERO;
        if (poValue == null) poValue = BigDecimal.ZERO;
        if (consumedPoValue == null) consumedPoValue = BigDecimal.ZERO;
        if (remainingPoValue == null) remainingPoValue = BigDecimal.ZERO;
        createdAt = LocalDateTime.now();
    }
}
