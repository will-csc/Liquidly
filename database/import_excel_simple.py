#!/usr/bin/env python3
"""
Gerador simples de arquivos .txt com INSERTs SQL a partir dos arquivos Excel da pasta `database/`.

Dependencias:
- openpyxl

Uso:
    python database/import_excel_simple.py
"""

from __future__ import annotations

from decimal import Decimal
from pathlib import Path
from typing import Any

import openpyxl

BASE_DIR = Path(__file__).resolve().parent
BOM_FILE = BASE_DIR / "BOM.xlsx"
CONVERSIONS_FILE = BASE_DIR / "Conversoes.xlsx"
INVOICES_FILE = BASE_DIR / "NFs.xlsx"
POS_FILE = BASE_DIR / "POs Pendentes.xlsx"

OUTPUT_DIR = BASE_DIR / "sql_txt_output"


def normalize_header(value: Any) -> str:
    return str(value or "").strip().lower().replace(" ", "_")


def load_rows(path: Path) -> list[dict[str, Any]]:
    workbook = openpyxl.load_workbook(path, data_only=True)
    sheet = workbook.active
    rows = list(sheet.iter_rows(values_only=True))
    if not rows:
        return []

    headers = [normalize_header(cell) for cell in rows[0]]
    items: list[dict[str, Any]] = []

    for values in rows[1:]:
        row = {headers[index]: values[index] for index in range(len(headers))}
        if all(value in (None, "") for value in row.values()):
            continue
        items.append(row)

    return items


def as_text(value: Any, default: str = "") -> str:
    if value is None:
        return default
    text = str(value).strip()
    return text if text else default


def as_int(value: Any) -> int | None:
    if value in (None, ""):
        return None
    return int(float(str(value).strip()))


def as_decimal(value: Any, default: str = "0") -> Decimal:
    if value in (None, ""):
        return Decimal(default)
    return Decimal(str(value).strip())


def sql_text(value: Any) -> str:
    if value is None:
        return "NULL"
    text = str(value).replace("'", "''")
    return f"'{text}'"


def sql_decimal(value: Decimal) -> str:
    return format(value, "f")


def build_single_insert(
    table_name: str,
    columns: list[str],
    values_rows: list[str],
    on_conflict: str | None = None,
) -> str:
    if not values_rows:
        return f"-- Nenhum registro para {table_name}\n"

    statement = f"INSERT INTO {table_name} ({', '.join(columns)})\nVALUES\n"
    statement += ",\n".join(values_rows)
    if on_conflict:
        statement += f"\n{on_conflict}"
    statement += ";\n"
    return statement


def write_sql_file(filename: str, content: str) -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    path = OUTPUT_DIR / filename
    path.write_text(content, encoding="utf-8")


def build_companies_sql(company_ids: set[int]) -> str:
    values_rows: list[str] = []
    for company_id in sorted(company_ids):
        values_rows.append(
            f"({company_id}, {sql_text(f'Imported Company {company_id}')})"
        )
    return build_single_insert(
        "companies",
        ["id", "company_name"],
        values_rows,
        "ON CONFLICT (id) DO NOTHING",
    )


def build_projects_sql(bom_rows: list[dict[str, Any]], invoice_rows: list[dict[str, Any]]) -> str:
    project_map: dict[int, tuple[str, int]] = {}

    for row in bom_rows:
        project_id = as_int(row.get("project_id"))
        company_id = as_int(row.get("company_id"))
        if project_id is None or company_id is None:
            continue
        project_name = as_text(row.get("project_name"), f"Project {project_id}")
        project_map[project_id] = (project_name, company_id)

    for row in invoice_rows:
        project_id = as_int(row.get("project_id"))
        company_id = as_int(row.get("company_id"))
        if project_id is None or company_id is None or project_id in project_map:
            continue
        project_map[project_id] = (f"Project {project_id}", company_id)

    values_rows: list[str] = []
    for project_id, (project_name, company_id) in sorted(project_map.items()):
        values_rows.append(
            f"({project_id}, {sql_text(project_name)}, {company_id})"
        )
    return build_single_insert(
        "projects",
        ["id", "name", "company_id"],
        values_rows,
        "ON CONFLICT (id) DO NOTHING",
    )


def build_bom_sql(rows: list[dict[str, Any]]) -> str:
    values_rows: list[str] = []
    for row in rows:
        project_id = as_int(row.get("project_id"))
        company_id = as_int(row.get("company_id"))
        if project_id is None or company_id is None:
            continue

        qntd = as_decimal(row.get("qntd"))
        remaining_qntd = as_decimal(row.get("remaining_qntd"), str(qntd))
        values_rows.append(
            "("
            f"{project_id}, "
            f"{sql_text(as_text(row.get('item_code')))}, "
            f"{sql_text(as_text(row.get('item_name')))}, "
            f"{sql_decimal(qntd)}, "
            f"{sql_text(as_text(row.get('um_bom')))}, "
            f"{sql_text(as_text(row.get('project_name'), f'Project {project_id}'))}, "
            f"{sql_decimal(remaining_qntd)}, "
            f"{company_id}"
            ")"
        )
    return build_single_insert(
        "boms",
        ["project_id", "item_code", "item_name", "qntd", "um_bom", "project_name", "remaining_qntd", "company_id"],
        values_rows,
    )


def build_conversions_sql(rows: list[dict[str, Any]]) -> str:
    values_rows: list[str] = []
    for row in rows:
        company_id = as_int(row.get("company_id"))
        if company_id is None:
            continue

        values_rows.append(
            "("
            f"{sql_text(as_text(row.get('item_code')))}, "
            f"{sql_text(as_text(row.get('um_bom')))}, "
            f"{sql_decimal(as_decimal(row.get('qntd_bom')))}, "
            f"{sql_text(as_text(row.get('um_invoice')))}, "
            f"{sql_decimal(as_decimal(row.get('qntd_invoice')))}, "
            f"{company_id}"
            ")"
        )
    return build_single_insert(
        "conversions",
        ["item_code", "um_bom", "qntd_bom", "um_invoice", "qntd_invoice", "company_id"],
        values_rows,
    )


def build_invoices_sql(rows: list[dict[str, Any]]) -> str:
    values_rows: list[str] = []
    for row in rows:
        project_id = as_int(row.get("project_id"))
        company_id = as_int(row.get("company_id"))
        if project_id is None or company_id is None:
            continue

        qntd_invoice = as_decimal(row.get("qntd_invoice"))
        remaining_qntd = as_decimal(row.get("remaining_qntd"), str(qntd_invoice))
        values_rows.append(
            "("
            f"{sql_text(as_text(row.get('invoice_date_string')))}, "
            f"{sql_text(as_text(row.get('invoice_number')))}, "
            f"{project_id}, "
            f"{sql_text(as_text(row.get('item_code')))}, "
            f"{sql_decimal(qntd_invoice)}, "
            f"{sql_decimal(remaining_qntd)}, "
            f"{sql_text(as_text(row.get('um_invoice')))}, "
            f"{sql_decimal(as_decimal(row.get('invoice_value')))}, "
            f"{sql_text(as_text(row.get('country')))}, "
            f"{company_id}"
            ")"
        )
    return build_single_insert(
        "invoices",
        ["invoice_date_string", "invoice_number", "project_id", "item_code", "qntd_invoice", "remaining_qntd", "um_invoice", "invoice_value", "country", "company_id"],
        values_rows,
    )


def build_pos_sql(rows: list[dict[str, Any]]) -> str:
    values_rows: list[str] = []
    for row in rows:
        company_id = as_int(row.get("company_id"))
        if company_id is None:
            continue

        qntd_po = as_decimal(row.get("qntd_po"))
        remaining_qntd = as_decimal(row.get("remaining_qntd"), str(qntd_po))
        values_rows.append(
            "("
            f"{sql_text(as_text(row.get('item_code')))}, "
            f"{sql_decimal(as_decimal(row.get('po_value')))}, "
            f"{sql_decimal(qntd_po)}, "
            f"{sql_decimal(remaining_qntd)}, "
            f"{sql_text(as_text(row.get('um_po')))}, "
            f"{company_id}"
            ")"
        )
    return build_single_insert(
        "pos",
        ["item_code", "po_value", "qntd_po", "remaining_qntd", "um_po", "company_id"],
        values_rows,
    )


def build_sequence_sql() -> str:
    return (
        "SELECT setval(pg_get_serial_sequence('companies', 'id'), COALESCE((SELECT MAX(id) FROM companies), 1), true);\n"
        "SELECT setval(pg_get_serial_sequence('projects', 'id'), COALESCE((SELECT MAX(id) FROM projects), 1), true);\n"
    )


def write_run_order_file() -> None:
    content = "\n".join(
        [
            "Ordem sugerida de execucao no PostgreSQL:",
            "1. 01_companies.txt",
            "2. 02_projects.txt",
            "3. 03_boms.txt",
            "4. 04_conversions.txt",
            "5. 05_invoices.txt",
            "6. 06_pos.txt",
            "7. 07_sequences.txt",
        ]
    )
    (OUTPUT_DIR / "00_run_order.txt").write_text(content + "\n", encoding="utf-8")


def main() -> None:
    bom_rows = load_rows(BOM_FILE)
    conversion_rows = load_rows(CONVERSIONS_FILE)
    invoice_rows = load_rows(INVOICES_FILE)
    po_rows = load_rows(POS_FILE)

    company_ids = set()
    for row in [*bom_rows, *conversion_rows, *invoice_rows, *po_rows]:
        company_id = as_int(row.get("company_id"))
        if company_id is not None:
            company_ids.add(company_id)

    companies_sql = build_companies_sql(company_ids)
    projects_sql = build_projects_sql(bom_rows, invoice_rows)
    boms_sql = build_bom_sql(bom_rows)
    conversions_sql = build_conversions_sql(conversion_rows)
    invoices_sql = build_invoices_sql(invoice_rows)
    pos_sql = build_pos_sql(po_rows)
    sequences_sql = build_sequence_sql()

    write_sql_file("01_companies.txt", companies_sql)
    write_sql_file("02_projects.txt", projects_sql)
    write_sql_file("03_boms.txt", boms_sql)
    write_sql_file("04_conversions.txt", conversions_sql)
    write_sql_file("05_invoices.txt", invoices_sql)
    write_sql_file("06_pos.txt", pos_sql)
    write_sql_file("07_sequences.txt", sequences_sql)
    write_run_order_file()

    print("Arquivos SQL gerados com sucesso.")
    print(f"Saida: {OUTPUT_DIR}")
    print(f"Companies: {len(company_ids)}")
    print("Projects, BOM, Conversoes, NFs e POs gerados em INSERT unico por arquivo.")


if __name__ == "__main__":
    main()
