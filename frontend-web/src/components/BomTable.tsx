import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { bomService, projectService } from "@/services/api";
import { readSessionUser } from "@/lib/authStorage";
import type { Bom, Project } from "@/types";
import { getCell, parseExcelFile, toNumber } from "@/lib/excel";
import { useI18n } from "@/i18n/i18n";

interface BomRow {
  id: string;
  projectId: number | null;
  projectName: string;
  itemCode: string;
  itemName: string;
  qntd: number;
  umBom: string;
  remainingQntd: number;
  companyId: number | null;
  createdAt: string | null;
}

const emptyItem = (): BomRow => ({
  id: '',
  projectId: null,
  projectName: "",
  itemCode: "",
  itemName: "",
  qntd: 0,
  umBom: "UN",
  remainingQntd: 0,
  companyId: null,
  createdAt: null,
});

const BomTable = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<BomRow[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<BomRow | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<BomRow>(emptyItem());
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<BomRow | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const noticeTimerRef = useRef<number | null>(null);

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
      let data: Bom[] = [];
      if (user && user.companyId) {
        data = await bomService.getByCompany(user.companyId);
      } else {
        // Fallback or fetch all if appropriate
        data = await bomService.getAll();
      }

      const mappedItems: BomRow[] = data.map((b) => {
        const qntd = typeof b.qntd === "number" ? b.qntd : Number(b.qntd);
        const remaining = b.remainingQntd ?? qntd;
        return {
          id: b.id?.toString() || "",
          projectId: b.project?.id ?? null,
          projectName: b.projectName || b.project?.name || "Default Project",
          itemCode: b.itemCode,
          itemName: b.itemName,
          qntd,
          umBom: b.umBom,
          remainingQntd: remaining,
          companyId: b.company?.id ?? null,
          createdAt: b.createdAt ?? null,
        };
      });
      setItems(mappedItems);
    } catch (error) {
      console.error("Failed to fetch BOM items", error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const user = readSessionUser<{ companyId?: number }>();
      let data: Project[] = [];
      if (user && user.companyId) {
        data = await projectService.getByCompany(user.companyId);
      } else {
        data = await projectService.getAll();
      }
      setProjects(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const normalizeItemCode = (code: string) => code.trim().toLowerCase();
  const normalizeProjectName = (name: string) => name.trim().toLowerCase();
  const isValidQuantity = (value: number) => Number.isFinite(value) && value > 0;

  const startEdit = (item: BomRow) => {
    setEditingId(item.id);
    const matchedProject =
      item.projectId != null
        ? projects.find((p) => p.id === item.projectId)
        : projects.find((p) => normalizeProjectName(p.name || "") === normalizeProjectName(item.projectName || ""));
    setEditDraft({ ...item, projectId: matchedProject?.id ?? item.projectId, projectName: matchedProject?.name ?? item.projectName });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = async () => {
    if (!editDraft) return;
    if (!editDraft.projectId) {
      showNotice("error", "Selecione o projeto.");
      return;
    }
    const itemCode = (editDraft.itemCode || "").trim();
    if (!itemCode) {
      showNotice("error", "item_code não pode ser vazio.");
      return;
    }
    const itemName = (editDraft.itemName || "").trim();
    if (!itemName) {
      showNotice("error", "item_name não pode ser vazio.");
      return;
    }
    const umBom = (editDraft.umBom || "").trim();
    if (!umBom) {
      showNotice("error", "um_bom não pode ser vazio.");
      return;
    }
    if (!isValidQuantity(editDraft.qntd)) {
      showNotice("error", "qntd deve ser maior que zero.");
      return;
    }
    const normalizedCode = normalizeItemCode(itemCode);
    const duplicateCode = items.some((b) => b.id !== editDraft.id && normalizeItemCode(b.itemCode) === normalizedCode);
    if (duplicateCode) {
      showNotice("error", "Esse item_code já existe.");
      return;
    }
    const projectExists = projects.some((p) => p.id === editDraft.projectId);
    if (!projectExists) {
      showNotice("error", "O projeto selecionado não existe para essa empresa.");
      return;
    }
    const project = projects.find((p) => p.id === editDraft.projectId);
    const safeDraft = {
      ...editDraft,
      itemCode,
      itemName,
      umBom,
      projectName: project?.name ?? editDraft.projectName,
      remainingQntd: editDraft.qntd,
    };

    try {
      const updated = await bomService.update(parseInt(editDraft.id, 10), {
        projectName: safeDraft.projectName,
        itemCode: safeDraft.itemCode,
        itemName: safeDraft.itemName,
        qntd: safeDraft.qntd,
        umBom: safeDraft.umBom,
        remainingQntd: safeDraft.remainingQntd,
        project: safeDraft.projectId != null ? { id: safeDraft.projectId } : undefined,
        company: safeDraft.companyId != null ? { id: safeDraft.companyId } : undefined,
      });

      const updatedItem: BomRow = {
        id: updated.id?.toString() || editDraft.id,
        projectId: updated.project?.id ?? safeDraft.projectId,
        projectName: updated.projectName || updated.project?.name || safeDraft.projectName,
        itemCode: updated.itemCode,
        itemName: updated.itemName,
        qntd: typeof updated.qntd === "number" ? updated.qntd : Number(updated.qntd),
        umBom: updated.umBom,
        remainingQntd: updated.remainingQntd ?? safeDraft.remainingQntd,
        companyId: updated.company?.id ?? safeDraft.companyId,
        createdAt: updated.createdAt ?? safeDraft.createdAt,
      };

      setItems((prev) => prev.map((i) => (i.id === editDraft.id ? updatedItem : i)));
      cancelEdit();
    } catch (error) {
      console.error("Failed to update item", error);
      showNotice("error", "Falha ao salvar alterações.");
    }
  };

  const requestDelete = (item: BomRow) => {
    setDeleteError(null);
    setDeleteCandidate(item);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate?.id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await bomService.delete(parseInt(deleteCandidate.id));
      setItems((prev) => prev.filter((i) => i.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    } catch (error) {
      console.error("Failed to delete item", error);
      setDeleteError("Falha ao deletar. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const addItem = async () => {
    if (!newItem.projectId) {
      showNotice("error", "Selecione o projeto.");
      return;
    }
    const itemCode = (newItem.itemCode || "").trim();
    if (!itemCode) {
      showNotice("error", "item_code não pode ser vazio.");
      return;
    }
    const itemName = (newItem.itemName || "").trim();
    if (!itemName) {
      showNotice("error", "item_name não pode ser vazio.");
      return;
    }
    const umBom = (newItem.umBom || "").trim();
    if (!umBom) {
      showNotice("error", "um_bom não pode ser vazio.");
      return;
    }
    if (!isValidQuantity(newItem.qntd)) {
      showNotice("error", "qntd deve ser maior que zero.");
      return;
    }
    const normalizedCode = normalizeItemCode(itemCode);
    const duplicateCode = items.some((b) => normalizeItemCode(b.itemCode) === normalizedCode);
    if (duplicateCode) {
      showNotice("error", "Esse item_code já existe.");
      return;
    }
    const projectExists = projects.some((p) => p.id === newItem.projectId);
    if (!projectExists) {
      showNotice("error", "O projeto selecionado não existe para essa empresa.");
      return;
    }
    
    try {
      const user = readSessionUser<{ companyId?: number }>();
      const companyId = user?.companyId;
      const project = projects.find((p) => p.id === newItem.projectId);
      const bomData: Bom = {
        projectName: project?.name ?? newItem.projectName,
        itemCode,
        itemName,
        qntd: newItem.qntd,
        umBom,
        remainingQntd: newItem.qntd,
        project: { id: newItem.projectId },
        company: companyId ? { id: companyId } : undefined,
      };

      const createdBom = await bomService.create(bomData);
      
      const createdItem: BomRow = {
        id: createdBom.id?.toString() || "",
        projectId: createdBom.project?.id ?? newItem.projectId,
        projectName: createdBom.projectName || createdBom.project?.name || newItem.projectName,
        itemCode: createdBom.itemCode,
        itemName: createdBom.itemName,
        qntd: createdBom.qntd,
        umBom: createdBom.umBom,
        remainingQntd: createdBom.remainingQntd ?? newItem.remainingQntd,
        companyId: createdBom.company?.id ?? companyId ?? null,
        createdAt: createdBom.createdAt ?? null,
      };

      setItems((prev) => [...prev, createdItem]);
      setNewItem(emptyItem());
      setAdding(false);
    } catch (error) {
      console.error("Failed to create item", error);
    }
  };

  const importFromExcel = async (file: File) => {
    setImporting(true);
    try {
      const { rows, rawHeaders } = await parseExcelFile(file);
      if (rows.length === 0) {
        showNotice("error", "Arquivo vazio ou sem linhas.");
        return;
      }

      const required = [
        ["project_name", "projectName", "project"],
        ["item_code", "itemCode", "code", "codigo"],
        ["item_name", "itemName", "description", "descricao"],
        ["qntd", "qty", "quantity", "quantidade"],
        ["um_bom", "umBom", "unit", "unidade"],
      ];

      const missing = required.filter((aliases) => {
        const has = rawHeaders.some((h) =>
          aliases.some((a) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, "") === a.trim().toLowerCase().replace(/[^a-z0-9]/g, ""))
        );
        return !has;
      });

      if (missing.length > 0) {
        showNotice("error", `Colunas obrigatórias faltando. Esperado: ${missing.map((m) => m[0]).join(", ")}`);
        return;
      }

      const user = readSessionUser<{ companyId?: number }>();

      const payloads: Bom[] = [];
      const errors: string[] = [];
      const existingCodes = new Set(items.map((b) => normalizeItemCode(b.itemCode)).filter(Boolean));
      const seenInFile = new Set<string>();
      const projectNames = new Set(projects.map((p) => normalizeProjectName(p.name || "")).filter(Boolean));

      rows.forEach((row, idx) => {
        const projectIdRaw = getCell(row, ["project_id", "projectId"]);
        const projectNameRaw = getCell(row, ["project_name", "projectName", "project"]);
        const itemCodeRaw = getCell(row, ["item_code", "itemCode", "code", "codigo"]);
        const itemNameRaw = getCell(row, ["item_name", "itemName", "description", "descricao"]);
        const umBomRaw = getCell(row, ["um_bom", "umBom", "unit", "unidade"]);
        const qntdRaw = getCell(row, ["qntd", "qty", "quantity", "quantidade"]);
        const remainingRaw = getCell(row, ["remaining_qntd", "remainingQntd", "remaining"]);

        const projectIdParsed = toNumber(projectIdRaw);
        const projectId = projectIdParsed === null ? undefined : Math.trunc(projectIdParsed);
        const projectNameOriginal = (projectNameRaw ?? "").toString().trim();
        const projectName = projectNameOriginal;
        const itemCode = (itemCodeRaw ?? "").toString().trim();
        const itemName = (itemNameRaw ?? "").toString().trim();
        const umBom = (umBomRaw ?? "").toString().trim();
        const qntd = toNumber(qntdRaw);
        const remainingParsed = toNumber(remainingRaw);

        const isEmpty =
          itemCode.length === 0 &&
          itemName.length === 0 &&
          umBom.length === 0 &&
          (qntdRaw === "" || qntdRaw === null || qntdRaw === undefined) &&
          projectName.length === 0;

        if (isEmpty) return;

        if (!projectName) errors.push(`Linha ${idx + 2}: project_name vazio`);
        if (!itemCode) errors.push(`Linha ${idx + 2}: item_code vazio`);
        if (!itemName) errors.push(`Linha ${idx + 2}: item_name vazio`);
        if (!umBom) errors.push(`Linha ${idx + 2}: um_bom vazio`);
        if (qntd === null) errors.push(`Linha ${idx + 2}: qntd inválido`);
        if (remainingRaw !== undefined && remainingRaw !== null && remainingRaw !== "" && remainingParsed === null) {
          errors.push(`Linha ${idx + 2}: remaining_qntd inválido`);
        }
        let isValid = true;
        if (projectName) {
          const normalizedProject = normalizeProjectName(projectName);
          if (!projectNames.has(normalizedProject)) {
            errors.push(`Linha ${idx + 2}: project_name não existe (${projectNameOriginal})`);
            isValid = false;
          }
        }
        if (itemCode) {
          const normalizedCode = normalizeItemCode(itemCode);
          if (existingCodes.has(normalizedCode)) {
            errors.push(`Linha ${idx + 2}: item_code já existe (${itemCode})`);
            isValid = false;
          } else if (seenInFile.has(normalizedCode)) {
            errors.push(`Linha ${idx + 2}: item_code duplicado no arquivo (${itemCode})`);
            isValid = false;
          } else {
            seenInFile.add(normalizedCode);
          }
        }

        if (isValid && projectName && itemCode && itemName && umBom && qntd !== null) {
          const matchedProject = projects.find((p) => normalizeProjectName(p.name || "") === normalizeProjectName(projectName));
          payloads.push({
            projectName: matchedProject?.name ?? projectName,
            itemCode,
            itemName,
            umBom,
            qntd,
            remainingQntd: remainingParsed ?? qntd,
            project:
              matchedProject?.id != null
                ? { id: matchedProject.id }
                : projectId != null
                  ? { id: projectId }
                  : undefined,
            company: user && user.companyId ? { id: user.companyId } : undefined,
          });
        }
      });

      if (errors.length > 0) {
        showNotice("error", `Erros no arquivo:\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? "\n..." : ""}`);
        return;
      }

      if (!confirm(`Importar ${payloads.length} itens de BOM?`)) return;

      const createdItems: BomRow[] = [];
      for (const payload of payloads) {
        const createdBom = await bomService.create(payload);
        createdItems.push({
          id: createdBom.id?.toString() || "",
          projectId: createdBom.project?.id ?? payload.project?.id ?? null,
          projectName: createdBom.projectName || payload.projectName || "Default Project",
          itemCode: createdBom.itemCode,
          itemName: createdBom.itemName,
          qntd: createdBom.qntd,
          umBom: createdBom.umBom,
          remainingQntd: createdBom.remainingQntd ?? payload.remainingQntd ?? createdBom.qntd,
          companyId: createdBom.company?.id ?? payload.company?.id ?? null,
          createdAt: createdBom.createdAt ?? null,
        });
      }

      setItems((prev) => [...prev, ...createdItems]);
      showNotice("success", `Importação concluída: ${createdItems.length} itens adicionados.`);
    } catch (e) {
      console.error(e);
      showNotice("error", "Falha ao importar o arquivo.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const renderRow = (item: BomRow) => {
    const isEditing = editingId === item.id;
    const current = isEditing && editDraft ? editDraft : item;

    return (
      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
        <td className="py-2 px-2">
          {isEditing ? (
            <select
              className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              value={current.projectId ?? ""}
              onChange={(e) => {
                const nextId = e.target.value === "" ? null : +e.target.value;
                const p = projects.find((x) => x.id === nextId);
                setEditDraft({ ...current, projectId: nextId, projectName: p?.name ?? "" });
              }}
            >
              <option value="">Selecione o projeto...</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          ) : (
            <span className="text-sm text-foreground">{current.projectName}</span>
          )}
        </td>
        <td className="py-2 px-2">
          {isEditing ? (
            <Input value={current.itemCode} onChange={(e) => setEditDraft({ ...current, itemCode: e.target.value })} className="h-8 text-sm" />
          ) : (
            <span className="text-sm font-medium text-foreground">{current.itemCode}</span>
          )}
        </td>
        <td className="py-2 px-2">
          {isEditing ? (
            <Input value={current.itemName} onChange={(e) => setEditDraft({ ...current, itemName: e.target.value })} className="h-8 text-sm" />
          ) : (
            <span className="text-sm text-foreground">{current.itemName}</span>
          )}
        </td>
        <td className="py-2 px-2 text-right">
          {isEditing ? (
            <Input
              type="number"
              step="any"
              min="0.000000001"
              value={current.qntd}
              onChange={(e) => {
                const nextQntd = +e.target.value;
                setEditDraft({ ...current, qntd: nextQntd, remainingQntd: nextQntd });
              }}
              className="h-8 text-sm w-24 text-right"
            />
          ) : (
            <span className="text-sm text-foreground">{current.qntd.toLocaleString()}</span>
          )}
        </td>
        <td className="py-2 px-2">
          {isEditing ? (
            <Input value={current.umBom} onChange={(e) => setEditDraft({ ...current, umBom: e.target.value })} className="h-8 text-sm w-20" />
          ) : (
            <span className="text-sm text-muted-foreground">{current.umBom}</span>
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-display font-bold text-foreground">{t("bom.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("bom.count", { count: items.length })}</p>
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
            <Plus className="w-4 h-4 mr-1.5" /> {t("bom.addItem")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">project_name</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">item_code</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">item_name</th>
                <th className="text-right py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">qntd</th>
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">um_bom</th>
                <th className="w-20" />
              </tr>
            </thead>
            <tbody>
              {adding && (
                <tr className="bg-primary/5 border-b border-border/50 animate-in fade-in">
                  <td className="py-2 px-2">
                    <select
                      className="flex h-8 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={newItem.projectId ?? ""}
                      onChange={(e) => {
                        const nextId = e.target.value === "" ? null : +e.target.value;
                        const p = projects.find((x) => x.id === nextId);
                        setNewItem({ ...newItem, projectId: nextId, projectName: p?.name ?? "" });
                      }}
                    >
                      <option value="">Selecione o projeto...</option>
                      {projects.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="py-2 px-2">
                    <Input placeholder="item_code" value={newItem.itemCode} onChange={(e) => setNewItem({ ...newItem, itemCode: e.target.value })} className="h-8 text-sm" />
                  </td>
                  <td className="py-2 px-2">
                    <Input placeholder="item_name" value={newItem.itemName} onChange={(e) => setNewItem({ ...newItem, itemName: e.target.value })} className="h-8 text-sm" />
                  </td>
                  <td className="py-2 px-2 text-right">
                    <Input
                      type="number"
                      step="any"
                      min="0.000000001"
                      placeholder="0"
                      value={newItem.qntd}
                      onChange={(e) => setNewItem({ ...newItem, qntd: +e.target.value })}
                      className="h-8 text-sm w-24 text-right"
                    />
                  </td>
                  <td className="py-2 px-2">
                    <Input placeholder="um_bom" value={newItem.umBom} onChange={(e) => setNewItem({ ...newItem, umBom: e.target.value })} className="h-8 text-sm w-20" />
                  </td>
                  <td className="py-2 px-2 text-center">
                    <div className="flex items-center gap-1 justify-center">
                      <button onClick={addItem} className="p-1.5 rounded-md hover:bg-primary/10 text-primary transition-colors"><Check className="w-4 h-4" /></button>
                      <button onClick={() => setAdding(false)} className="p-1.5 rounded-md hover:bg-destructive/10 text-destructive transition-colors"><X className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              )}
              {items.map((item) => renderRow(item))}
            </tbody>
          </table>
          {items.length === 0 && !loading && !adding && (
             <div className="p-8 text-center text-muted-foreground">{t("bom.empty")}</div>
          )}
          {loading && (
             <div className="p-8 text-center text-muted-foreground">{t("common.loading")}</div>
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
            <div className="text-base font-semibold text-foreground">Deletar item</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Tem certeza que deseja deletar {deleteCandidate.itemCode}?
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

export default BomTable;
