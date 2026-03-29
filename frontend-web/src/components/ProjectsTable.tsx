import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Check, CheckCircle2, Plus, Pencil, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { projectService } from "@/services/api";
import type { Project } from "@/types";
import { getCell, parseExcelFile } from "@/lib/excel";
import { useI18n } from "@/i18n/i18n";

const emptyProject = (): Project => ({
  id: undefined,
  name: "",
  description: "",
  status: "Active",
  startDate: "",
  endDate: "",
});

const normalizeProjectName = (name: string) => name.trim().toLowerCase();

const ProjectsTable = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Project | null>(null);
  const [adding, setAdding] = useState(false);
  const [newItem, setNewItem] = useState<Project>(emptyProject());
  const [importing, setImporting] = useState(false);
  const importInputRef = useRef<HTMLInputElement>(null);
  const [deleteCandidate, setDeleteCandidate] = useState<Project | null>(null);
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
      const userStr = localStorage.getItem("user");
      const user = userStr ? (JSON.parse(userStr) as { companyId?: number }) : null;
      let data: Project[] = [];
      if (user && user.companyId) {
        data = await projectService.getByCompany(user.companyId);
      } else {
        data = await projectService.getAll();
      }
      setItems(data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const startEdit = (item: Project) => {
    if (!item.id) return;
    setEditingId(item.id);
    setEditDraft({ ...item });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditDraft(null);
  };

  const saveEdit = () => {
    // TODO: Implement update API
    if (!editDraft || !editDraft.id) return;
    const name = normalizeProjectName(editDraft.name || "");
    if (!name) return;
    const exists = items.some((p) => p.id !== editDraft.id && normalizeProjectName(p.name || "") === name);
    if (exists) {
      showNotice("error", "Já existe um projeto com esse nome.");
      return;
    }
    setItems((prev) => prev.map((i) => (i.id === editDraft.id ? editDraft : i)));
    cancelEdit();
  };

  const requestDelete = (project: Project) => {
    setDeleteError(null);
    setDeleteCandidate(project);
  };

  const confirmDelete = async () => {
    if (!deleteCandidate?.id) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await projectService.delete(deleteCandidate.id);
      setItems((prev) => prev.filter((i) => i.id !== deleteCandidate.id));
      setDeleteCandidate(null);
    } catch (error) {
      console.error("Failed to delete project", error);
      setDeleteError("Falha ao deletar. Tente novamente.");
    } finally {
      setDeleting(false);
    }
  };

  const addItem = async () => {
    const name = normalizeProjectName(newItem.name || "");
    if (!name) return;
    const exists = items.some((p) => normalizeProjectName(p.name || "") === name);
    if (exists) {
      showNotice("error", "Já existe um projeto com esse nome.");
      return;
    }
    
    try {
      const userStr = localStorage.getItem("user");
      const user = userStr ? (JSON.parse(userStr) as { companyId?: number }) : null;
      const payload: Project = {
        name: newItem.name.trim(),
        company: user && user.companyId ? { id: user.companyId } : undefined,
      };
      
      const created = await projectService.create(payload);
      setItems((prev) => [...prev, created]);
      setNewItem(emptyProject());
      setAdding(false);
    } catch (error) {
      console.error("Failed to create project", error);
      showNotice("error", "Falha ao criar projeto.");
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

      const userStr = localStorage.getItem("user");
      const user = userStr ? (JSON.parse(userStr) as { companyId?: number }) : null;

      const payloads: Project[] = [];
      const errors: string[] = [];
      const existing = new Set(items.map((p) => normalizeProjectName(p.name || "")).filter(Boolean));
      const seenInFile = new Set<string>();

      rows.forEach((row, idx) => {
        const nameRaw = getCell(row, ["name", "projectName", "project", "nome"]);

        const nameOriginal = (nameRaw ?? "").toString().trim();
        const name = normalizeProjectName(nameOriginal);

        const isEmpty =
          name.length === 0;

        if (isEmpty) return;

        if (!name) errors.push(`Linha ${idx + 2}: name vazio`);

        if (name) {
          if (existing.has(name)) {
            errors.push(`Linha ${idx + 2}: projeto já existe (${nameOriginal})`);
            return;
          }
          if (seenInFile.has(name)) {
            errors.push(`Linha ${idx + 2}: projeto duplicado no arquivo (${nameOriginal})`);
            return;
          }
          seenInFile.add(name);
          payloads.push({
            name: nameOriginal,
            company: user && user.companyId ? { id: user.companyId } : undefined,
          });
        }
      });

      if (errors.length > 0) {
        showNotice("error", `Erros no arquivo:\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? "\n..." : ""}`);
        return;
      }

      if (!confirm(`Importar ${payloads.length} projetos?`)) return;

      const created: Project[] = [];
      for (const payload of payloads) {
        created.push(await projectService.create(payload));
      }

      setItems((prev) => [...prev, ...created]);
      showNotice("success", `Importação concluída: ${created.length} projetos adicionados.`);
    } catch (e) {
      console.error(e);
      showNotice("error", "Falha ao importar o arquivo.");
    } finally {
      setImporting(false);
      if (importInputRef.current) importInputRef.current.value = "";
    }
  };

  const renderRow = (item: Project) => {
    const isEditing = editingId === item.id;
    const p = isEditing && editDraft ? editDraft : item;

    return (
      <tr key={item.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
        <td className="py-2 px-2">
          {isEditing ? <Input value={p.name} onChange={(e) => setEditDraft({ ...p, name: e.target.value })} className="h-8 text-sm" /> : <span className="text-sm font-medium text-foreground">{p.name}</span>}
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
          <h1 className="text-xl font-display font-bold text-foreground">{t("projects.title")}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{t("projects.count", { count: items.length })}</p>
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
            <Plus className="w-4 h-4 mr-1.5" /> {t("projects.newProject")}
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl shadow-card border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">{t("common.name")}</th>
                <th className="text-center py-2.5 px-2 text-xs font-medium text-muted-foreground uppercase tracking-wider w-24">{t("common.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => renderRow(item))}
              {adding && (
                <tr className="bg-primary/5 border-b border-border/50 animate-in fade-in">
                  <td className="py-2 px-2">
                    <Input autoFocus placeholder="Project Name" value={newItem.name} onChange={(e) => setNewItem({ ...newItem, name: e.target.value })} className="h-8 text-sm" />
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
              <div className="p-8 text-center text-muted-foreground">{t("projects.empty")}</div>
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
            <div className="text-base font-semibold text-foreground">Deletar projeto</div>
            <div className="mt-1 text-sm text-muted-foreground">
              Tem certeza que deseja deletar {deleteCandidate.name}?
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

export default ProjectsTable;
