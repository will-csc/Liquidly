import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Play, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bomService, invoiceService, poService, projectService, reportService } from "@/services/api";
import type { Bom, Invoice, Po, Project } from "@/types";
import { useI18n } from "@/i18n/i18n";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

const Section = ({ title, children }: SectionProps) => (
  <div className="space-y-3">
    <h2 className="font-display text-lg font-semibold text-foreground tracking-tight">{title}</h2>
    <div className="space-y-2.5">{children}</div>
  </div>
);

const FieldRow = ({
  label,
  placeholder,
  value,
  onChange,
  type = "text",
  min,
  max,
  disabled = false,
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: string;
  max?: string;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-3">
    <label className="text-sm font-medium text-muted-foreground w-24 text-right shrink-0">{label}</label>
    <Input
      type={type}
      placeholder={placeholder || ""}
      className="bg-secondary/50 border-border focus:bg-card transition-colors"
      value={value}
      onChange={onChange}
      min={min}
      max={max}
      disabled={disabled}
    />
  </div>
);

const SelectRow = ({
  label,
  options,
  value,
  onChange,
  placeholder,
  disabled = false,
}: {
  label: string;
  options: { value: string | number; label: string }[];
  value?: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
  disabled?: boolean;
}) => (
  <div className="flex items-center gap-3">
    <label className="text-sm font-medium text-muted-foreground w-24 text-right shrink-0">{label}</label>
    <select
      className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:bg-card"
      value={value}
      onChange={onChange}
      disabled={disabled}
    >
      <option value="">{placeholder || "Select..."}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const normalizeDateForInput = (dateCandidate?: string) => {
  if (!dateCandidate) return null;

  const trimmed = dateCandidate.trim();
  const isoMatch = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  }

  const localDateMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (localDateMatch) {
    return `${localDateMatch[3]}-${localDateMatch[2]}-${localDateMatch[1]}`;
  }

  const parsed = new Date(trimmed);
  if (Number.isNaN(parsed.getTime())) return null;

  return parsed.toISOString().slice(0, 10);
};

const getInvoiceDateRange = (invoices: Invoice[]) => {
  const dates = invoices
    .map((invoice) => normalizeDateForInput(invoice.invoiceDateString) ?? normalizeDateForInput(invoice.createdAt))
    .filter((date): date is string => Boolean(date))
    .sort();

  return {
    minDate: dates[0] || "",
    maxDate: dates[dates.length - 1] || "",
  };
};

const clampDate = (value: string, bounds: { min?: string; max?: string }) => {
  if (!value) return "";
  if (bounds.min && value < bounds.min) return bounds.min;
  if (bounds.max && value > bounds.max) return bounds.max;
  return value;
};

const normalizeText = (value?: string | number | null) => String(value ?? "").trim().toLowerCase();

const isBomFromProject = (bom: Bom, project?: Project) => {
  if (!project?.id) return true;
  if (bom.project?.id != null) return bom.project.id === project.id;
  return normalizeText(bom.projectName) === normalizeText(project.name);
};

const ReportsForm = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pos, setPos] = useState<Po[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBom, setSelectedBom] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [invoiceDateRange, setInvoiceDateRange] = useState<{ minDate: string; maxDate: string }>({
    minDate: "",
    maxDate: "",
  });
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  const [noticeTimer, setNoticeTimer] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  const showNotice = (type: "error" | "success", message: string) => {
    setNotice({ type, message });
    if (noticeTimer) window.clearTimeout(noticeTimer);
    const next = window.setTimeout(() => {
      setNotice(null);
    }, 3500);
    setNoticeTimer(next);
  };

  useEffect(() => {
    return () => {
      if (noticeTimer) window.clearTimeout(noticeTimer);
    };
  }, [noticeTimer]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem("user");
        const user = userStr ? (JSON.parse(userStr) as { companyId?: number }) : null;

        if (user && user.companyId) {
          const [projectsData, bomsData, invoicesData, posData] = await Promise.all([
            projectService.getByCompany(user.companyId),
            bomService.getByCompany(user.companyId),
            invoiceService.getByCompany(user.companyId),
            poService.getByCompany(user.companyId),
          ]);
          const range = getInvoiceDateRange(invoicesData);
          setProjects(projectsData);
          setBoms(bomsData);
          setInvoices(invoicesData);
          setPos(posData);
          setInvoiceDateRange(range);
          setStartDate((current) => current || range.minDate);
          setEndDate((current) => current || range.maxDate);
        } else {
          const [projectsData, bomsData, invoicesData, posData] = await Promise.all([
            projectService.getAll(),
            bomService.getAll(),
            invoiceService.getAll(),
            poService.getAll(),
          ]);
          const range = getInvoiceDateRange(invoicesData);
          setProjects(projectsData);
          setBoms(bomsData);
          setInvoices(invoicesData);
          setPos(posData);
          setInvoiceDateRange(range);
          setStartDate((current) => current || range.minDate);
          setEndDate((current) => current || range.maxDate);
        }
      } catch (error) {
        console.error("Failed to fetch report data", error);
      }
    };
    void fetchData();
  }, []);

  const selectedProjectData = projects.find((project) => String(project.id ?? "") === selectedProject);
  const filteredBoms = selectedProjectData ? boms.filter((bom) => isBomFromProject(bom, selectedProjectData)) : [];
  const projectSelected = Boolean(selectedProject);
  const canRunReport = Boolean(selectedProject && selectedBom && startDate && endDate) && !isRunning;

  useEffect(() => {
    if (!selectedBom) return;
    if (selectedBom === "all") return;
    const bomStillAvailable = filteredBoms.some((bom) => String(bom.id ?? "") === selectedBom);
    if (!bomStillAvailable) {
      setSelectedBom("");
    }
  }, [filteredBoms, selectedBom]);

  const handleStartDateChange = (value: string) => {
    const nextStartDate = clampDate(value, {
      min: invoiceDateRange.minDate || undefined,
      max: endDate || invoiceDateRange.maxDate || undefined,
    });
    setStartDate(nextStartDate);
  };

  const handleEndDateChange = (value: string) => {
    const nextEndDate = clampDate(value, {
      min: startDate || invoiceDateRange.minDate || undefined,
      max: invoiceDateRange.maxDate || undefined,
    });
    setEndDate(nextEndDate);
  };

  const handleRunReport = async () => {
    if (startDate && endDate && startDate > endDate) {
      showNotice("error", "A data inicial deve ser menor ou igual à data final.");
      return;
    }
    if (!selectedProject) {
      showNotice("error", "Selecione um projeto.");
      return;
    }
    if (!selectedBom) {
      showNotice("error", "Selecione os itens (ex: All).");
      return;
    }
    if (invoices.length === 0) {
      showNotice("error", "Não existem invoices cadastradas para a empresa.");
      return;
    }

    const userStr = localStorage.getItem("user");
    const user = userStr ? (JSON.parse(userStr) as { companyId?: number; email?: string }) : null;
    const companyId = user?.companyId;
    const email = user?.email;
    const selectedProjectId = Number(selectedProject);
    const bomScope =
      selectedBom === "all"
        ? filteredBoms
        : filteredBoms.filter((bom) => String(bom.id ?? "") === selectedBom);
    const projectInvoices = invoices.filter((invoice) => invoice.project?.id === selectedProjectId);

    if (!companyId) {
      showNotice("error", "Company não encontrado.");
      return;
    }
    if (!email) {
      showNotice("error", "Email do usuário não encontrado.");
      return;
    }
    if (projectInvoices.length === 0) {
      showNotice("error", "Não existem invoices para o projeto selecionado.");
      return;
    }
    if (bomScope.length === 0) {
      showNotice("error", "Não existem itens de BOM para o projeto selecionado.");
      return;
    }

    const poItemCodes = new Set(pos.map((poItem) => normalizeText(poItem.itemCode)).filter(Boolean));
    const missingPoItems = bomScope.filter((bom) => !poItemCodes.has(normalizeText(bom.itemCode)));

    if (missingPoItems.length > 0) {
      const preview = missingPoItems
        .slice(0, 5)
        .map((bom) => bom.itemCode)
        .join(", ");
      const suffix = missingPoItems.length > 5 ? "..." : "";
      showNotice("error", `Existem itens da BOM sem PO cadastrado na empresa: ${preview}${suffix}`);
      return;
    }

    setIsRunning(true);
    try {
      await reportService.runReport({
        companyId,
        projectId: selectedProjectId,
        email,
        selectedBom,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      showNotice("success", t("report.notice.success"));
    } catch (err: unknown) {
      type ErrorWithResponse = { response?: { data?: { message?: string } } };
      const maybe = err as ErrorWithResponse;
      const message = maybe?.response?.data?.message || t("report.notice.failed");
      showNotice("error", message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-elevated p-8 space-y-6 border border-border/50 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">{t("report.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("report.subtitle")}</p>
      </div>

      <Section title={t("report.section.projectDetails")}>
        <SelectRow
          label={t("report.label.project")}
          placeholder={t("report.placeholder.selectProject")}
          options={projects.map((p) => ({ value: p.id || "", label: p.name }))}
          value={selectedProject}
          onChange={(e) => {
            setSelectedProject(e.target.value);
            setSelectedBom("");
          }}
        />
      </Section>
      <div className="h-px bg-border" />
      <Section title={t("report.section.bomDetails")}>
        <SelectRow
          label={t("report.label.items")}
          placeholder={t("report.placeholder.chooseItems")}
          options={[
            { value: "all", label: t("report.option.all") },
            ...filteredBoms.map((b) => ({ value: b.id || "", label: `${b.itemCode} - ${b.itemName}` })),
          ]}
          value={selectedBom}
          onChange={(e) => setSelectedBom(e.target.value)}
          disabled={!projectSelected}
        />
      </Section>
      <div className="h-px bg-border" />
      <Section title={t("report.section.dateRange")}>
        <FieldRow
          label={t("report.label.startDate")}
          placeholder="dd/mm/yyyy"
          type="date"
          value={startDate}
          onChange={(e) => handleStartDateChange(e.target.value)}
          min={invoiceDateRange.minDate || undefined}
          max={endDate || invoiceDateRange.maxDate || undefined}
          disabled={!projectSelected}
        />
        <FieldRow
          label={t("report.label.endDate")}
          placeholder="dd/mm/yyyy"
          type="date"
          value={endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          min={startDate || invoiceDateRange.minDate || undefined}
          max={invoiceDateRange.maxDate || undefined}
          disabled={!projectSelected}
        />
      </Section>

      <div className="pt-2 space-y-2">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-card hover:shadow-elevated transition-all"
          onClick={handleRunReport}
          disabled={!canRunReport}
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? t("report.button.running") : t("report.button.run")}
        </Button>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" />
          {t("report.helper.emailSent")}
        </p>
      </div>

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

export default ReportsForm;
