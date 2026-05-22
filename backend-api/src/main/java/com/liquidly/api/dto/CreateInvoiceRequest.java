package com.liquidly.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateInvoiceRequest {
    @NotNull(message = "Project is required")
    private Long projectId;

    @NotBlank(message = "Item code is required")
    private String itemCode;

    @NotBlank(message = "Invoice number is required")
    private String invoiceNumber;

    @NotBlank(message = "Country is required")
    private String country;

    @NotBlank(message = "Invoice date is required")
    private String invoiceDateString;

    @NotNull(message = "Invoice value is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Invoice value cannot be negative")
    private BigDecimal invoiceValue;

    @NotNull(message = "Invoice quantity is required")
    @DecimalMin(value = "0.0001", message = "Invoice quantity must be greater than zero")
    private BigDecimal qntdInvoice;

    @NotBlank(message = "Invoice unit is required")
    private String umInvoice;

    @DecimalMin(value = "0.0", inclusive = true, message = "Remaining quantity cannot be negative")
    private BigDecimal remainingQntd;
}
