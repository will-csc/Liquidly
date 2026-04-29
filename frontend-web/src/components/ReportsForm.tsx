import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, LoaderCircle, Mail, Play, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bomService, invoiceService, poService, projectService, reportService } from "@/services/api";
import { readSessionUser } from "@/lib/authStorage";
import type { Bom, Invoice, Po, Project, ReportJobStatusResponse } from "@/types";
import { useI18n } from "@/i18n/i18n";

interface SectionProps {
  title: string;
  children: React.ReactNode;
}

interface NoticeState {
  type: "error" | "success";
  title: string;
  message: string;
  details?: string[];
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

const wait = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

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
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [reportProgress, setReportProgress] = useState<ReportJobStatusResponse | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const noticeTimerRef = useRef<number | null>(null);
  const isMountedRef = useRef(true);

  const showNotice = (type: "error" | "success", title: string, message: string, details?: string[]) => {
    setNotice({ type, title, message, details });
    if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    if (type === "error") {
      noticeTimerRef.current = null;
      return;
    }
    noticeTimerRef.current = window.setTimeout(() => {
      setNotice(null);
      noticeTimerRef.current = null;
    }, 3500);
  };

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (noticeTimerRef.current) window.clearTimeout(noticeTimerRef.current);
    };
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = readSessionUser<{ companyId?: number }>();

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
  const remainingPercent = reportProgress ? Math.max(0, 100 - reportProgress.progress) : 0;

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
    setReportProgress(null);
    setStartDate(nextStartDate);
  };

  const handleEndDateChange = (value: string) => {
    const nextEndDate = clampDate(value, {
      min: startDate || invoiceDateRange.minDate || undefined,
      max: invoiceDateRange.maxDate || undefined,
    });
    setReportProgress(null);
    setEndDate(nextEndDate);
  };

  const pollReportProgress = async (jobId: string, companyId: number) => {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await reportService.getReportStatus(jobId, companyId);
      if (!isMountedRef.current) return;

      setReportProgress(status);

      if (status.status === "completed") {
        showNotice("success", "Relatório concluído", status.message || "O relatório foi gerado com sucesso.");
        setIsRunning(false);
        return;
      }

      if (status.status === "failed") {
        showNotice(
          "error",
          "Falha ao executar relatório",
          status.errorMessage || status.message || "O backend não conseguiu concluir o relatório."
        );
        setIsRunning(false);
        return;
      }

      await wait(1200);
    }

    if (isMountedRef.current) {
      showNotice(
        "error",
        "Tempo de processamento excedido",
        "O relatório demorou mais do que o esperado para responder. Tente novamente em instantes."
      );
      setIsRunning(false);
    }
  };

  const handleRunReport = async () => {
    const user = readSessionUser<{ companyId?: number; email?: string }>();
    const companyId = user?.companyId;
    const email = user?.email;
    const selectedProjectId = Number(selectedProject);
    const bomScope =
      selectedBom === "all"
        ? filteredBoms
        : filteredBoms.filter((bom) => String(bom.id ?? "") === selectedBom);
    const projectInvoices = invoices.filter((invoice) => invoice.project?.id === selectedProjectId);
    const validationErrors: string[] = [];

    if (startDate && endDate && startDate > endDate) {
      validationErrors.push("A data inicial deve ser menor ou igual à data final.");
    }
    if (!selectedProject) {
      validationErrors.push("Selecione um projeto.");
    }
    if (!selectedBom) {
      validationErrors.push("Selecione os itens da BOM.");
    }
    if (!startDate || !endDate) {
      validationErrors.push("Preencha o período inicial e final.");
    }
    if (invoices.length === 0) {
      validationErrors.push("Não existem invoices cadastradas para a empresa.");
    }

    if (!companyId) {
      validationErrors.push("Company não encontrado.");
    }
    if (!email) {
      validationErrors.push("Email do usuário não encontrado.");
    }
    if (projectInvoices.length === 0) {
      validationErrors.push("Não existem invoices para o projeto selecionado.");
    }
    if (bomScope.length === 0) {
      validationErrors.push("Não existem itens de BOM para o projeto selecionado.");
    }

    const poItemCodes = new Set(pos.map((poItem) => normalizeText(poItem.itemCode)).filter(Boolean));
    const missingPoItems = bomScope.filter((bom) => !poItemCodes.has(normalizeText(bom.itemCode)));

    if (missingPoItems.length > 0) {
      const preview = missingPoItems
        .slice(0, 5)
        .map((bom) => bom.itemCode)
        .join(", ");
      const suffix = missingPoItems.length > 5 ? "..." : "";
      validationErrors.push(`Existem itens da BOM sem PO cadastrado na empresa: ${preview}${suffix}`);
    }

    if (validationErrors.length > 0) {
      showNotice(
        "error",
        "Não foi possível iniciar o relatório",
        "Corrija os pontos abaixo antes de continuar.",
        validationErrors
      );
      return;
    }

    const safeCompanyId = companyId as number;
    const safeEmail = email as string;
    setReportProgress(null);
    setIsRunning(true);
    setNotice(null);
    try {
      const job = await reportService.runReport({
        companyId: safeCompanyId,
        projectId: selectedProjectId,
        email: safeEmail,
        selectedBom,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      const initialStatus = await reportService.getReportStatus(job.jobId, safeCompanyId);
      if (isMountedRef.current) {
        setReportProgress(initialStatus);
      }
      await pollReportProgress(job.jobId, safeCompanyId);
    } catch (err: unknown) {
      type ErrorWithResponse = { response?: { data?: { message?: string } } };
      const maybe = err as ErrorWithResponse;
      const message = maybe?.response?.data?.message || t("report.notice.failed");
      showNotice("error", "Falha ao iniciar relatório", message);
      setIsRunning(false);
    } finally {
      if (!isMountedRef.current) return;
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
            setReportProgress(null);
            setNotice(null);
          }}
          disabled={isRunning}
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
          onChange={(e) => {
            setSelectedBom(e.target.value);
            setReportProgress(null);
          }}
          disabled={!projectSelected || isRunning}
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
          disabled={!projectSelected || isRunning}
        />
        <FieldRow
          label={t("report.label.endDate")}
          placeholder="dd/mm/yyyy"
          type="date"
          value={endDate}
          onChange={(e) => handleEndDateChange(e.target.value)}
          min={startDate || invoiceDateRange.minDate || undefined}
          max={invoiceDateRange.maxDate || undefined}
          disabled={!projectSelected || isRunning}
        />
      </Section>

      {reportProgress && (
        <div className="rounded-2xl border border-border/60 bg-secondary/30 p-4 shadow-card">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-sm font-semibold text-foreground">Acompanhamento do relatório</div>
              <div className="text-xs text-muted-foreground mt-1">
                {reportProgress.stage} · {reportProgress.message}
              </div>
            </div>
            <div
              className={`rounded-full px-3 py-1 text-xs font-semibold ${
                reportProgress.status === "failed"
                  ? "bg-destructive/10 text-destructive"
                  : reportProgress.status === "completed"
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-foreground"
              }`}
            >
              {reportProgress.progress}%
            </div>
          </div>

          <div className="mt-4 h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                reportProgress.status === "failed" ? "bg-destructive" : "bg-primary"
              }`}
              style={{ width: `${reportProgress.progress}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
            <span>Concluído: {reportProgress.completedSteps}%</span>
            <span>Falta: {remainingPercent}%</span>
            <span>Etapas restantes: {reportProgress.remainingSteps}</span>
          </div>

          {reportProgress.errorMessage && (
            <div className="mt-3 rounded-xl border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {reportProgress.errorMessage}
            </div>
          )}
        </div>
      )}

      <div className="pt-2 space-y-2">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-card hover:shadow-elevated transition-all"
          onClick={handleRunReport}
          disabled={!canRunReport}
        >
          {isRunning ? <LoaderCircle className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {isRunning ? `${t("report.button.running")} ${reportProgress?.progress ?? 0}%` : t("report.button.run")}
        </Button>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" />
          {t("report.helper.emailSent")}
        </p>
      </div>

      {notice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className={`pointer-events-auto w-full max-w-lg rounded-2xl border p-5 shadow-elevated ${
              notice.type === "error"
                ? "border-destructive/30 bg-card"
                : "border-primary/30 bg-card"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-xl p-2 ${notice.type === "error" ? "bg-destructive/10" : "bg-primary/10"}`}>
                {notice.type === "error" ? (
                  <AlertTriangle className="h-5 w-5 text-destructive" />
                ) : (
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-base font-semibold text-foreground">{notice.title}</div>
                    <div className="mt-1 text-sm text-muted-foreground whitespace-pre-line">{notice.message}</div>
                  </div>
                  <button
                    type="button"
                    className="rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
                    onClick={() => setNotice(null)}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {notice.details && notice.details.length > 0 && (
                  <div className="mt-4 space-y-2 max-h-56 overflow-auto">
                    {notice.details.map((detail, index) => (
                      <div
                        key={`${detail}-${index}`}
                        className={`rounded-xl border px-3 py-2 text-sm ${
                          notice.type === "error"
                            ? "border-destructive/15 bg-card text-foreground"
                            : "border-primary/15 bg-card text-foreground"
                        }`}
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsForm;
