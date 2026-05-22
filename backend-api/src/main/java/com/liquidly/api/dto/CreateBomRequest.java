package com.liquidly.api.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class CreateBomRequest {
    @NotNull(message = "Project is required")
    private Long projectId;

    @NotBlank(message = "Project name is required")
    private String projectName;

    @NotBlank(message = "Item code is required")
    private String itemCode;

    @NotBlank(message = "Item name is required")
    private String itemName;

    @NotBlank(message = "BOM unit is required")
    private String umBom;

    @NotNull(message = "Quantity is required")
    @DecimalMin(value = "0.0001", message = "Quantity must be greater than zero")
    private BigDecimal qntd;

    @DecimalMin(value = "0.0", inclusive = true, message = "Remaining quantity cannot be negative")
    private BigDecimal remainingQntd;
}
