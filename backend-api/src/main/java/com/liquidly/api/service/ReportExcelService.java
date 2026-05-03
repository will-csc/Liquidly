package com.liquidly.api.service;

import com.liquidly.api.model.Bom;
import com.liquidly.api.model.LiquidationResult;
import com.liquidly.api.repository.BomRepository;
import org.apache.poi.ss.usermodel.Cell;
import org.apache.poi.ss.usermodel.CellStyle;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Service
public class ReportExcelService {
    private static final String[] HEADERS = {
            "project_name",
            "item",
            "um_bom",
            "qntd_bom",
            "qntd_consumed_bom",
            "remaining_qntd",
            "invoice_number",
            "invoice_country",
            "invoice_date_string",
            "invoice_value",
            "um_invoice",
            "qntd_invoice",
            "consumed_invoice_value",
            "qntd_consumed_invoice",
            "remaining_invoice_value",
            "remaining_qntd_invoice",
            "po_number",
            "po_value",
            "um_po",
            "qntd_po",
            "consumed_po_value",
            "qntd_consumed_po",
            "remaining_po_value",
            "remaining_qntd_po",
            "created_at"
    };

    @Autowired
    private BomRepository bomRepository;

    public GeneratedReport buildLiquidationReport(
            Long companyId,
            Long projectId,
            String selectedBom,
            String startDate,
            String endDate,
            List<LiquidationResult> results
    ) {
        String itemCodeFilter = resolveItemCode(companyId, selectedBom);
        LocalDate start = parseDate(startDate);
        LocalDate end = parseDate(endDate);
        List<LiquidationResult> filteredRows = filterRows(results, itemCodeFilter, start, end);

        try (Workbook workbook = new XSSFWorkbook(); ByteArrayOutputStream output = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("Report");
            CellStyle quantityStyle = workbook.createCellStyle();
            quantityStyle.setDataFormat(workbook.createDataFormat().getFormat("0.0000"));

            CellStyle moneyStyle = workbook.createCellStyle();
            moneyStyle.setDataFormat(workbook.createDataFormat().getFormat("0.00"));

            writeHeader(sheet);
            writeRows(sheet, filteredRows, quantityStyle, moneyStyle);
            autosizeColumns(sheet);
            workbook.write(output);

            return new GeneratedReport(
                    output.toByteArray(),
                    buildFilename(projectId, itemCodeFilter),
                    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
        } catch (IOException ex) {
            throw new RuntimeException("Nao foi possivel gerar o arquivo Excel do relatorio.", ex);
        }
    }

    private void writeHeader(Sheet sheet) {
        Row row = sheet.createRow(0);
        for (int i = 0; i < HEADERS.length; i++) {
            row.createCell(i).setCellValue(HEADERS[i]);
        }
    }

    private void writeRows(Sheet sheet, List<LiquidationResult> rows, CellStyle quantityStyle, CellStyle moneyStyle) {
        for (int index = 0; index < rows.size(); index++) {
            LiquidationResult result = rows.get(index);
            Row row = sheet.createRow(index + 1);

            writeString(row, 0, result.getProjectName());
            writeString(row, 1, result.getItem());
            writeString(row, 2, result.getUmBom());
            writeDecimal(row, 3, result.getQntdBom(), quantityStyle);
            writeDecimal(row, 4, result.getQntdConsumedBom(), quantityStyle);
            writeDecimal(row, 5, result.getRemainingQntd(), quantityStyle);
            writeString(row, 6, result.getInvoiceNumber());
            writeString(row, 7, result.getInvoiceCountry());
            writeString(row, 8, result.getInvoiceDateString());
            writeDecimal(row, 9, result.getInvoiceValue(), moneyStyle);
            writeString(row, 10, result.getUmInvoice());
            writeDecimal(row, 11, result.getQntdInvoice(), quantityStyle);
            writeDecimal(row, 12, result.getConsumedInvoiceValue(), moneyStyle);
            writeDecimal(row, 13, result.getQntdConsumedInvoice(), quantityStyle);
            writeDecimal(row, 14, result.getRemainingInvoiceValue(), moneyStyle);
            writeDecimal(row, 15, result.getRemainingQntdInvoice(), quantityStyle);
            writeString(row, 16, result.getPoNumber());
            writeDecimal(row, 17, result.getPoValue(), moneyStyle);
            writeString(row, 18, result.getUmPo());
            writeDecimal(row, 19, result.getQntdPo(), quantityStyle);
            writeDecimal(row, 20, result.getConsumedPoValue(), moneyStyle);
            writeDecimal(row, 21, result.getQntdConsumedPo(), quantityStyle);
            writeDecimal(row, 22, result.getRemainingPoValue(), moneyStyle);
            writeDecimal(row, 23, result.getRemainingQntdPo(), quantityStyle);
            writeString(row, 24, result.getCreatedAt() == null ? "" : result.getCreatedAt().toString());
        }
    }

    private void writeString(Row row, int column, String value) {
        row.createCell(column).setCellValue(value == null ? "" : value);
    }

    private void writeDecimal(Row row, int column, BigDecimal value, CellStyle style) {
        Cell cell = row.createCell(column);
        if (value != null) {
            cell.setCellValue(value.doubleValue());
            cell.setCellStyle(style);
        }
    }

    private void autosizeColumns(Sheet sheet) {
        for (int i = 0; i < HEADERS.length; i++) {
            sheet.autoSizeColumn(i);
            int currentWidth = sheet.getColumnWidth(i);
            int maxWidth = 55 * 256;
            sheet.setColumnWidth(i, Math.min(Math.max(currentWidth + 512, 10 * 256), maxWidth));
        }
    }

    private List<LiquidationResult> filterRows(
            List<LiquidationResult> rows,
            String itemCodeFilter,
            LocalDate startDate,
            LocalDate endDate
    ) {
        List<LiquidationResult> filtered = new ArrayList<>();
        for (LiquidationResult row : rows) {
            if (itemCodeFilter != null && !normalize(row.getItem()).equals(normalize(itemCodeFilter))) {
                continue;
            }

            if ((startDate != null || endDate != null) && !matchesDateRange(row, startDate, endDate)) {
                continue;
            }

            filtered.add(row);
        }
        return filtered;
    }

    private boolean matchesDateRange(LiquidationResult row, LocalDate startDate, LocalDate endDate) {
        LocalDate rowDate = parseDate(row.getInvoiceDateString());
        if (rowDate == null) {
            LocalDateTime createdAt = row.getCreatedAt();
            rowDate = createdAt == null ? null : createdAt.toLocalDate();
        }
        if (rowDate == null) {
            return false;
        }
        if (startDate != null && rowDate.isBefore(startDate)) {
            return false;
        }
        if (endDate != null && rowDate.isAfter(endDate)) {
            return false;
        }
        return true;
    }

    private String resolveItemCode(Long companyId, String selectedBom) {
        if (selectedBom == null || selectedBom.trim().isEmpty() || "all".equalsIgnoreCase(selectedBom.trim())) {
            return null;
        }
        if (!selectedBom.trim().matches("\\d+")) {
            return null;
        }
        Long bomId = Long.valueOf(selectedBom.trim());
        Bom bom = bomRepository.findByIdAndCompanyId(bomId, companyId)
                .orElseThrow(() -> new RuntimeException("Item da BOM nao encontrado para gerar o arquivo."));
        return bom.getItemCode();
    }

    private LocalDate parseDate(String value) {
        if (value == null || value.trim().isEmpty()) {
            return null;
        }

        String trimmed = value.trim();
        try {
            return LocalDate.parse(trimmed);
        } catch (Exception ignored) {
            // continue
        }

        try {
            return LocalDate.parse(trimmed, DateTimeFormatter.ofPattern("dd/MM/yyyy"));
        } catch (Exception ignored) {
            return null;
        }
    }

    private String buildFilename(Long projectId, String itemCodeFilter) {
        String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
        String projectPart = projectId == null ? "project" : "project_" + projectId;
        String itemPart = itemCodeFilter == null || itemCodeFilter.isBlank()
                ? "all_items"
                : normalizeFilename(itemCodeFilter);
        return "liquidly_report_" + projectPart + "_" + itemPart + "_" + timestamp + ".xlsx";
    }

    private String normalizeFilename(String value) {
        return value
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "_")
                .replaceAll("^_+|_+$", "");
    }

    private String normalize(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }

    public record GeneratedReport(byte[] content, String filename, String contentType) {
    }
}
