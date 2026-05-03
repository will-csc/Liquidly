BEGIN;

-- Remove todos os resultados já gerados do relatório/liquidação
DELETE FROM liquidation_results;

-- Restaura o saldo da PO para o valor original da quantidade da PO
UPDATE pos
SET remaining_qntd = qntd_po;

-- Restaura o saldo da invoice para o valor original da quantidade da invoice
UPDATE invoices
SET remaining_qntd = qntd_invoice;

-- Restaura o saldo da BOM para o valor original da quantidade da BOM
UPDATE boms
SET remaining_qntd = qntd;

COMMIT;
