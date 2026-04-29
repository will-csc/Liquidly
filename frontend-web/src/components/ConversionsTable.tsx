import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bomService, conversionService, invoiceService } from "@/services/api";
import { readSessionUser } from "@/lib/authStorage";
import type { Bom, Conversion as ApiConversion, Invoice } from "@/types";
import { getCell, parseExcelFile, toNumber } from "@/lib/excel";
import { useI18n } from "@/i18n/i18n";

interface ConversionRow {
  id: string;
  itemCode: string;
  qntdInvoice: number;
  umInvoice: string;
  qntdBom: number;
  umBom: string;
  conversionFactor: number;
  companyId: number | null;
  createdAt: string | null;
}

const emptyConversion = (): ConversionRow => ({
  id: '',
  itemCode: "",
  qntdInvoice: 1,
  umInvoice: "",
  qntdBom: 1,
  umBom: "",
  conversionFactor: 1,
  companyId: null,
  createdAt: null,
});

const ConversionsTable = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<ConversionRow[]>([]);
  const [bomUmByItemCode, setBomUmByItemCode] = useState<Record<string, string>>({});
  const [bomEntries, setBomEntries] = useState<Array<{ projectKey: string; projectName: string; itemCode: string; umBom: string }>>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<ConversionRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<ConversionRow>(emptyConversion());
  const [showAllItems, setShowAllItems] = useState(false);
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<ConversionRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);
  const normalizeItemCode = (code: string) => code.trim().toLowerCase();
  const normalizeUm = (um: string) => um.trim().toLowerCase();
  const projectKey = (id?: number, name?: string) => (id != null ? `id:${id}` : `name:${(name || "").trim().toLowerCase()}`);

  const showNotice = (type: "error" | "success", message: string) => {
    setNotice({ type, message });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const user = readSessionUser<{ companyId?: number }>();
      let data: ApiConversion[] = [];
      if (user && user.companyId) {
        data = await conversionService.getByCompany(user.companyId);
      } else {
        data = await conversionService.getAll();
      }

      const mappedItems: ConversionRow[] = data.map((c) => {
        const qntdInvoice = c.qntdInvoice ?? 0;
        const qntdBom = c.qntdBom ?? 0;
        const conversionFactor = c.conversionFactor ?? (qntdInvoice === 0 ? 0 : qntdBom / qntdInvoice);
        return {
          id: c.id?.toString() || "",
          itemCode: c.itemCode || "N/A",
          qntdInvoice,
          umInvoice: c.umInvoice,
          qntdBom,
          umBom: c.umBom,
          conversionFactor,
          companyId: c.company?.id ?? null,
          createdAt: c.createdAt ?? null,
        };
      });
      setItems(mappedItems);
    } catch (error) {
      console.error("Failed to fetch conversions", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const fetchBomLookup = useCallback(async () => {
    try {
      const user = readSessionUser<{ companyId?: number }>();
      const companyId = user?.companyId;
      const boms = companyId ? await bomService.getByCompany(companyId) : await bomService.getAll();
      const map: Record<string, string> = {};
      for (const b of boms) {
        const key = normalizeItemCode(b.itemCode || "");
        if (!key) continue;
        if (!map[key] && b.umBom) map[key] = b.umBom;
      }
      setBomUmByItemCode(map);
      setBomEntries(
        boms
          .filter((b): b is Bom => Boolean(b && b.itemCode && b.umBom))
          .map((b) => ({
            projectKey: projectKey(b.project?.id, b.project?.name || b.projectName),
            projectName: (b.project?.name || b.projectName || "").toString(),
            itemCode: b.itemCode,
            umBom: b.umBom,
          }))
      );
    } catch (error) {
      console.error("Failed to fetch BOM lookup for conversions", error);
    }
  }, []);

  useEffect(() => {
    fetchBomLookup();
  }, [fetchBomLookup]);

  const fetchInvoices = useCallback(async () => {
    try {
      const user = readSessionUser<{ companyId?: number }>();
      const companyId = user?.companyId;
      const data = companyId ? await invoiceService.getByCompany(companyId) : await invoiceService.getAll();
      setInvoices(data);
    } catch (error) {
      console.error("Failed to fetch invoices for conversions analysis", error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const missingConversions = useMemo(() => {
    if (invoices.length === 0 || bomEntries.length === 0) return [];

    const conversionsSet = new Set(
      items.map((c) => `${normalizeItemCode(c.itemCode)}|${normalizeUm(c.umInvoice)}|${normalizeUm(c.umBom)}`)
    );

    const bomsByProjectKey = new Map<string, Array<{ itemCode: string; umBom: string; projectName: string }>>();
    for (const b of bomEntries) {
      const list = bomsByProjectKey.get(b.projectKey) || [];
      list.push({ itemCode: b.itemCode, umBom: b.umBom, projectName: b.projectName });
      bomsByProjectKey.set(b.projectKey, list);
    }

    const missingByKey = new Map<
      string,
      { projectName: string; itemCode: string; fromUm: string; toUm: string; invoiceNumbers: Set<string> }
    >();

    for (const inv of invoices) {
      const invItemCode = normalizeItemCode(inv.itemCode || "");
      const invUm = (inv.umInvoice || "").trim();
      if (!invItemCode || !invUm) continue;
      const invProjectKey = projectKey(inv.project?.id, inv.project?.name);
      const relevantBoms = bomsByProjectKey.get(invProjectKey);
      if (!relevantBoms || relevantBoms.length === 0) continue;

      for (const b of relevantBoms) {
        if (invItemCode !== normalizeItemCode(b.itemCode)) continue;
        if (normalizeUm(invUm) === normalizeUm(b.umBom)) continue;
        const key = `${normalizeItemCode(b.itemCode)}|${normalizeUm(invUm)}|${normalizeUm(b.umBom)}`;
        if (conversionsSet.has(key)) continue;

        const groupKey = `${invProjectKey}|${key}`;
        const existing = missingByKey.get(groupKey);
        if (existing) {
          if (inv.invoiceNumber) existing.invoiceNumbers.add(inv.invoiceNumber);
        } else {
          missingByKey.set(groupKey, {
            projectName: b.projectName,
            itemCode: b.itemCode,
            fromUm: invUm,
            toUm: b.umBom,
            invoiceNumbers: new Set(inv.invoiceNumber ? [inv.invoiceNumber] : []),
          });
        }
      }
    }

    return Array.from(missingByKey.values())
      .map((m) => ({ ...m, invoiceNumbers: Array.from(m.invoiceNumbers).slice(0, 3) }))
      .sort((a, b) => {
        const p = a.projectName.localeCompare(b.projectName);
        if (p !== 0) return p;
        return a.itemCode.localeCompare(b.itemCode);
      });
  }, [bomEntries, invoices, items]);

  const startEdit = (item: ConversionRow) => { setEditingId(item.id); setEditDraft({ ...item }); };
  const cancelEdit = () => { setEditingId(null); setEditDraft(null); };
  
  const saveEdit = async () => { 
    if (!editDraft) return;
    const normalizedCode = normalizeItemCode(editDraft.itemCode);
    const bomUm = bomUmByItemCode[normalizedCode];
    if (!bomUm) {
      showNotice("error", "Esse item_code não existe na tabela BOM da empresa.");
      return;
    }
    const duplicate = items.some(
      (c) =>
        c.id !== editDraft.id &&
        normalizeItemCode(c.itemCode) === normalizedCode &&
        c.umInvoice.trim().toLowerCase() === editDraft.umInvoice.trim().toLowerCase() &&
        c.umBom.trim().toLowerCase() === bomUm.trim().toLowerCase()
    );
    if (duplicate) {
      showNotice("error", "Essa conversão já existe.");
      return;
    }
    const safeDraft = { ...editDraft, umBom: bomUm };

    try {
      const updated = await conversionService.update(parseInt(editDraft.id, 10), {
        itemCode: safeDraft.itemCode,
        qntdInvoice: safeDraft.qntdInvoice,
        umInvoice: safeDraft.umInvoice,
        qntdBom: safeDraft.qntdBom,
        umBom: safeDraft.umBom,
        company: safeDraft.companyId != null ? { id: safeDraft.companyId } : undefined,
      });

      const updatedItem: ConversionRow = {
        id: updated.id?.toString() || editDraft.id,
        itemCode: updated.itemCode || safeDraft.itemCode,
        qntdInvoice: updated.qntdInvoice ?? safeDraft.qntdInvoice,
        umInvoice: updated.umInvoice,
        qntdBom: updated.qntdBom ?? safeDraft.qntdBom,
        umBom: updated.umBom || safeDraft.umBom,
        conversionFactor:
          updated.conversionFactor ??
          ((updated.qntdInvoice ?? safeDraft.qntdInvoice) === 0
            ? 0
            : (updated.qntdBom ?? safeDraft.qntdBom) / (updated.qntdInvoice ?? safeDraft.qntdInvoice)),
        companyId: updated.company?.id ?? safeDraft.companyId,
        createdAt: updated.createdAt ?? safeDraft.createdAt,
      };

      setItems((p) => p.map((i) => (i.id === editDraft.id ? updatedItem : i)));
      cancelEdit();
    } catch (error) {
      console.error("Failed to update conversion", error);
      showNotice("error", "Falha ao salvar conversão.");
    }
  };
  
  const requestDelete = (item: ConversionRow) => {
    setDeleteError(null);
    setDeleteCandidate(item);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate?.id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await conversionService.delete(parseInt(deleteCandidate.id));
      setItems((p) => p.filter((i) => i.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    } catch (error) {
      console.error("Failed to delete conversion", error);
      setDeleteError("Falha ao deletar. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };
  
  const addItem = async () => { 
    if (!newItem.itemCode || !newItem.umInvoice || !newItem.umBom) return; 
    const normalizedCode = normalizeItemCode(newItem.itemCode);
    const bomUm = bomUmByItemCode[normalizedCode];
    if (!bomUm) {
      showNotice("error", "Esse item_code não existe na tabela BOM da empresa.");
      return;
    }
    if (normalizeItemCode(newItem.umBom) !== normalizeItemCode(bomUm)) {
      setNewItem((prev) => ({ ...prev, umBom: bomUm }));
    }
    const duplicate = items.some(
      (c) =>
        normalizeItemCode(c.itemCode) === normalizedCode &&
        c.umInvoice.trim().toLowerCase() === newItem.umInvoice.trim().toLowerCase() &&
        c.umBom.trim().toLowerCase() === bomUm.trim().toLowerCase()
    );
    if (duplicate) {
      showNotice("error", "Essa conversão já existe.");
      return;
    }
    
    try {
      const user = readSessionUser<{ companyId?: number }>();
      const companyId = user?.companyId;
      const conversionData: ApiConversion = {
        itemCode: newItem.itemCode,
        qntdInvoice: newItem.qntdInvoice,
        umInvoice: newItem.umInvoice,
        qntdBom: newItem.qntdBom,
        umBom: bomUm,
        company: companyId ? { id: companyId } : undefined,
      };
      
      const created = await conversionService.create(conversionData);
      
      const createdItem: ConversionRow = {
        id: created.id?.toString() || "",
        itemCode: created.itemCode || newItem.itemCode,
        qntdInvoice: created.qntdInvoice ?? newItem.qntdInvoice,
        umInvoice: created.umInvoice,
        qntdBom: created.qntdBom ?? newItem.qntdBom,
        umBom: created.umBom || bomUm,
        conversionFactor: created.conversionFactor ?? (newItem.qntdInvoice === 0 ? 0 : newItem.qntdBom / newItem.qntdInvoice),
        companyId: created.company?.id ?? companyId ?? null,
        createdAt: created.createdAt ?? null,
      };

      setItems((p) => [...p, createdItem]); 
      setNewItem(emptyConversion()); 
      setAdding(false); 
    } catch (error) {
      console.error("Failed to create conversion", error);
    }
  };

  const importFromExcel = async (file: File) => {
    setImporting(true);
    try {
      const { rows } = await parseExcelFile(file);
      if (rows.length === 0) {
        showNotice("error", "Arquivo vazio ou sem linhas.");
        return;
      }

      const user = readSessionUser<{ companyId?: number }>();
      const companyId = user?.companyId;

      const payloads: ApiConversion[] = [];
      const errors: string[] = [];
      const existingKeys = new Set(
        items.map((c) => `${normalizeItemCode(c.itemCode)}|${c.umInvoice.trim().toLowerCase()}|${c.umBom.trim().toLowerCase()}`)
      );
      const seenInFile = new Set<string>();

      rows.forEach((row, idx) => {
        const itemCodeRaw = getCell(row, ["item_code", "itemCode", "code", "item", "codigo"]);
        const qntdInvoiceRaw = getCell(row, ["qntd_invoice", "qntdInvoice"]);
        const umInvoiceRaw = getCell(row, ["um_invoice", "umInvoice", "from", "de"]);
        const qntdBomRaw = getCell(row, ["qntd_bom", "qntdBom"]);
        const umBomRaw = getCell(row, ["um_bom", "umBom", "to", "para"]);

        const itemCode = (itemCodeRaw ?? "").toString().trim();
        const qntdInvoice = toNumber(qntdInvoiceRaw);
        const umInvoice = (umInvoiceRaw ?? "").toString().trim();
        const qntdBom = toNumber(qntdBomRaw);
        const bomUm = bomUmByItemCode[normalizeItemCode(itemCode)] || "";

        const isEmpty =
          itemCode.length === 0 &&
          umInvoice.length === 0 &&
          (qntdInvoiceRaw === "" || qntdInvoiceRaw === null || qntdInvoiceRaw === undefined) &&
          (qntdBomRaw === "" || qntdBomRaw === null || qntdBomRaw === undefined) &&
          (umBomRaw === "" || umBomRaw === null || umBomRaw === undefined);

        if (isEmpty) return;

        if (!itemCode) errors.push(`Linha ${idx + 2}: itemCode vazio`);
        if (qntdInvoice === null) errors.push(`Linha ${idx + 2}: qntd_invoice inválido`);
        if (!umInvoice) errors.push(`Linha ${idx + 2}: um_invoice vazio`);
        if (qntdBom === null) errors.push(`Linha ${idx + 2}: qntd_bom inválido`);
        if (!bomUm) errors.push(`Linha ${idx + 2}: item_code não existe no BOM (${itemCode})`);

        if (itemCode && qntdInvoice !== null && umInvoice && qntdBom !== null && bomUm) {
          const key = `${normalizeItemCode(itemCode)}|${umInvoice.trim().toLowerCase()}|${bomUm.trim().toLowerCase()}`;
          if (existingKeys.has(key)) {
            errors.push(`Linha ${idx + 2}: conversão já existe (${itemCode})`);
            return;
          }
          if (seenInFile.has(key)) {
            errors.push(`Linha ${idx + 2}: conversão duplicada no arquivo (${itemCode})`);
            return;
          }
          seenInFile.add(key);
          payloads.push({
            itemCode,
            qntdInvoice,
            umInvoice,
            qntdBom,
            umBom: bomUm,
            company: companyId ? { id: companyId } : undefined,
          });
        }
      });

      if (errors.length > 0) {
        showNotice("error", `Erros no arquivo:\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? "\n..." : ""}`);
        return;
      }

      if (!confirm(`Importar ${payloads.length} conversões?`)) return;

      const createdItems: ConversionRow[] = [];
      for (const payload of payloads) {
        const created = await conversionService.create(payload);
        createdItems.push({
          id: created.id?.toString() || "",
          itemCode: created.itemCode || payload.itemCode,
          qntdInvoice: created.qntdInvoice ?? payload.qntdInvoice ?? 0,
          umInvoice: created.umInvoice,
          qntdBom: created.qntdBom ?? payload.qntdBom ?? 0,
          umBom: created.umBom,
          conversionFactor:
            created.conversionFactor ??
            ((created.qntdInvoice ?? payload.qntdInvoice ?? 0) === 0
              ? 0
              : (created.qntdBom ?? payload.qntdBom ?? 0) / (created.qntdInvoice ?? payload.qntdInvoice ?? 1)),
          companyId: created.company?.id ?? payload.company?.id ?? null,
          createdAt: created.createdAt ?? null,
        });
      }

      setItems((prev) => [...prev, ...createdItems]);
      showNotice("success", `Importação concluída: ${createdItems.length} conversões adicionadas.`);
    } catch (e) {
      console.error(e);
      showNotice("error", "Falha ao importar o arquivo.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const renderRow = (item: ConversionRow) => {
    const isEditing = editingId === item.id;
    const c = isEditing && editDraft ? editDraft : item;

    return (
      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
        <td className="py-2 px-2">
          {isEditing ? (
            <Input
              value={c.itemCode}
              onChange={(e) => {
                const nextItemCode = e.target.value;
                const bomUm = bomUmByItemCode[normalizeItemCode(nextItemCode)] || "";
                setEditDraft({ ...c, itemCode: nextItemCode, umBom: bomUm || c.umBom });
              }}
              className="h-8 text-sm"
            />
          ) : (
            <span className="text-sm text-muted-foreground">{c.itemCode}</span>
          )}
        </td>
        <td className="py-2 px-2 text-right">
          {isEditing ? <Input type="number" step="any" value={c.qntdInvoice} onChange={(e) => setEditDraft({ ...c, qntdInvoice: +e.target.value })} className="h-8 text-sm w-28 text-right" /> : <span className="text-sm font-mono text-foreground">{c.qntdInvoice}</span>}
        </td>
        <td className="py-2 px-2">
          {isEditing ? <Input value={c.umInvoice} onChange={(e) => setEditDraft({ ...c, umInvoice: e.target.value })} className="h-8 text-sm w-24" /> : <span className="text-sm font-medium text-foreground">{c.umInvoice}</span>}
        </td>
        <td className="py-2 px-2 text-right">
          {isEditing ? <Input type="number" step="any" value={c.qntdBom} onChange={(e) => setEditDraft({ ...c, qntdBom: +e.target.value })} className="h-8 text-sm w-28 text-right" /> : <span className="text-sm font-mono text-foreground">{c.qntdBom}</span>}
        </td>
        <td className="py-2 px-2">
          {isEditing ? (
            <Input value={c.umBom} disabled className="h-8 text-sm w-24" />
          ) : (
            <span className="text-sm font-medium text-foreground">{c.umBom}</span>
          )}
        </td>
        <td className="py-2 px-2 text-center">
          {isEditing ? (
            <div className="flex items-center gap-1 justify-center">
              <button onClick={saveEdit} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"><Check className="w-4 h-4" /></button>
              <button onClick={cancelEdit} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-1 justify-center">
              <button onClick={() => startEdit(item)} className="p-1.5 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"><Pencil className="w-3.5 h-3.5" /></button>
              <button onClick={() => requestDelete(item)} className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          )}
        </td>
      </tr>
    );
  };

  const visibleItems = showAllItems ? items : items.slice(0, 20);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">{t("conversions.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("conversions.count", { count: items.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <input
            ref={importInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            style={{ display: "none" }}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importFromExcel(f);
            }}
          />
          <Button
            variant="outline"
            size="sm"
            className="rounded-lg"
            disabled={adding || loading || importing}
            onClick={() => importInputRef.current?.click()}
          >
            {t("common.importExcel")}
          </Button>
          <Button onClick={() => setAdding(true)} disabled={adding || loading || importing} size="sm" className="rounded-lg">
            <Plus className="w-4 h-4 mr-1.5" /> {t("conversions.addConversion")}
          </Button>
        </div>
      </div>

      {missingConversions.length > 0 && (
        <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
          <div className="p-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-semibold text-foreground">{t("conversions.missing.title")}</div>
                <div className="text-xs text-muted-foreground">{t("conversions.missing.subtitle")}</div>
              </div>
              <div className="text-xs text-muted-foreground">{missingConversions.length}</div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary/40">
                  <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">project</th>
                  <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">item_code</th>
                  <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">missing</th>
                  <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">invoices</th>
                </tr>
              </thead>
              <tbody>
                {missingConversions.slice(0, 20).map((m) => (
                  <tr key={`${m.projectName}|${m.itemCode}|${m.fromUm}|${m.toUm}`} className="border-b border-border/50">
                    <td className="py-2 px-2">
                      <span className="text-sm text-foreground">{m.projectName || "—"}</span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-sm font-mono text-foreground">{m.itemCode}</span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-sm text-foreground">
                        {m.fromUm} → {m.toUm}
                      </span>
                    </td>
                    <td className="py-2 px-2">
                      <span className="text-sm text-muted-foreground">{m.invoiceNumbers.length > 0 ? m.invoiceNumbers.join(", ") : "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {missingConversions.length > 20 && (
              <div className="p-3 text-xs text-muted-foreground">{t("common.showingOf", { shown: 20, total: missingConversions.length })}</div>
            )}
          </div>
        </div>
      )}

      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">item_code</th>
                <th className="text-right py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">qntd_invoice</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">um_invoice</th>
                <th className="text-right py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">qntd_bom</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">um_bom</th>
                <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibleItems.map((item) => renderRow(item))}
              {adding && (
                <tr className="bg-primary/5 border-b border-border/50 animate-in fade-in">
                  <td className="py-2 px-2">
                    <Input
                      autoFocus
                      placeholder="item_code"
                      value={newItem.itemCode}
                      onChange={(e) => {
                        const nextItemCode = e.target.value;
                        const bomUm = bomUmByItemCode[normalizeItemCode(nextItemCode)] || "";
                        setNewItem({ ...newItem, itemCode: nextItemCode, umBom: bomUm || "" });
                      }}
                      className="h-8 text-sm"
                    />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input type="number" step="any" placeholder="0" value={newItem.qntdInvoice} onChange={(e) => setNewItem({ ...newItem, qntdInvoice: +e.target.value })} className="h-8 text-sm w-28 text-right" />
                  </td>
                  <td className="py-2 px-2">
                    <Input placeholder="um_invoice" value={newItem.umInvoice} onChange={(e) => setNewItem({ ...newItem, umInvoice: e.target.value })} className="h-8 text-sm w-24" />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input type="number" step="any" placeholder="0" value={newItem.qntdBom} onChange={(e) => setNewItem({ ...newItem, qntdBom: +e.target.value })} className="h-8 text-sm w-28 text-right" />
                  </td>
                  <td className="py-2 px-2">
                    <Input placeholder="um_bom" value={newItem.umBom} disabled className="h-8 text-sm w-24" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={addItem} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setAdding(false)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
           {items.length === 0 && !loading && !adding && (
              <div className="p-8 text-center text-muted-foreground">{t("conversions.empty")}</div>
           )}
           {loading && (
              <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
           )}
           {items.length > 20 && !loading && (
              <div className="flex items-center justify-between gap-3 border-t border-border/50 p-3">
                <div className="text-xs text-muted-foreground">
                  {showAllItems
                    ? `${items.length} itens exibidos`
                    : `${visibleItems.length} de ${items.length} itens exibidos`}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllItems((current) => !current)}
                >
                  {showAllItems ? "Mostrar menos" : "Mostrar todos"}
                </Button>
              </div>
           )}
        </div>
      </div>
      {deleteCandidate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onMouseDown={(e) => {
            if (e.currentTarget === e.target && !deleting) setDeleteCandidate(null);
          }}
        >
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-elevated">
            <div className="text-base font-semibold text-foreground">Deletar conversão</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Tem certeza que deseja deletar a conversão do item {deleteCandidate.itemCode}?
            </div>
            {deleteError && <div className="mt-3 text-sm text-destructive">{deleteError}</div>}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" type="button" disabled={deleting} onClick={() => setDeleteCandidate(null)}>
                Cancelar
              </Button>
              <Button variant="destructive" type="button" disabled={deleting} onClick={confirmDelete}>
                Deletar
              </Button>
            </div>
          </div>
        </div>
      )}
      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className={`flex items-start gap-3 rounded-xl border p-3 shadow-elevated ${
              notice.type === "error" ? "border-destructive/30 bg-destructive/10" : "border-primary/30 bg-primary/10"
            } pointer-events-auto w-full max-w-sm`}
          >
            <div className="pt-0.5">
              {notice.type === "error" ? (
                <AlertTriangle className="h-4 w-4 text-destructive" />
              ) : (
                <CheckCircle2 className="h-4 w-4 text-primary" />
              )}
            </div>
            <div className="flex-1 text-sm text-foreground whitespace-pre-line max-h-40 overflow-auto">{notice.message}</div>
            <button
              type="button"
              className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
              onClick={() => setNotice(null)}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionsTable;
