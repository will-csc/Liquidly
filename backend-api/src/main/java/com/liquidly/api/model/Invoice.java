package com.liquidly.api.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

// JPA entity representing an invoice line used as supply for liquidation.
@Entity
@Table(name = "invoices")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Invoice {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "project_id")
    private Project project;

    @Column(name = "item_code", nullable = false)
    private String itemCode;

    @Column(name = "invoice_number", nullable = false)
    private String invoiceNumber;

    @Column(name = "country", nullable = false, length = 2)
    private String country;

    @Column(name = "invoice_date_string", nullable = false, length = 40)
    private String invoiceDateString;

    @Column(name = "invoice_value", nullable = false, precision = 15, scale = 2)
    private BigDecimal invoiceValue;

    @Column(name = "qntd_invoice", nullable = false, precision = 15, scale = 4)
    private BigDecimal qntdInvoice;

    @Column(name = "um_invoice", nullable = false)
    private String umInvoice;

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
        if (country == null) country = "";
        if (invoiceDateString == null) invoiceDateString = "";
        if (invoiceValue == null) invoiceValue = BigDecimal.ZERO;
        createdAt = LocalDateTime.now();
    }
}
