import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, Mail, Play, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { bomService, projectService, reportService } from "@/services/api";
import type { Bom, Project } from "@/types";

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
}: {
  label: string;
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  min?: string;
  max?: string;
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
    />
  </div>
);

const SelectRow = ({
  label,
  options,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  options: { value: string | number; label: string }[];
  value?: string | number;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder?: string;
}) => (
  <div className="flex items-center gap-3">
    <label className="text-sm font-medium text-muted-foreground w-24 text-right shrink-0">{label}</label>
    <select
      className="flex h-10 w-full rounded-md border border-input bg-secondary/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors focus:bg-card"
      value={value}
      onChange={onChange}
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

const ReportsForm = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [selectedBom, setSelectedBom] = useState<string>("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
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
          const [projectsData, bomsData] = await Promise.all([
            projectService.getByCompany(user.companyId),
            bomService.getByCompany(user.companyId),
          ]);
          setProjects(projectsData);
          setBoms(bomsData);
        } else {
          const [projectsData, bomsData] = await Promise.all([projectService.getAll(), bomService.getAll()]);
          setProjects(projectsData);
          setBoms(bomsData);
        }
      } catch (error) {
        console.error("Failed to fetch report data", error);
      }
    };
    void fetchData();
  }, []);

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

    const userStr = localStorage.getItem("user");
    const user = userStr ? (JSON.parse(userStr) as { companyId?: number; email?: string }) : null;
    const companyId = user?.companyId;
    const email = user?.email;

    if (!companyId) {
      showNotice("error", "Company não encontrado.");
      return;
    }
    if (!email) {
      showNotice("error", "Email do usuário não encontrado.");
      return;
    }

    setIsRunning(true);
    try {
      await reportService.runReport({
        companyId,
        projectId: Number(selectedProject),
        email,
        selectedBom,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      });
      showNotice("success", "Relatório gerado e enviado por email.");
    } catch (err: unknown) {
      type ErrorWithResponse = { response?: { data?: { message?: string } } };
      const maybe = err as ErrorWithResponse;
      const message = maybe?.response?.data?.message || "Não foi possível gerar/enviar o relatório.";
      showNotice("error", message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="bg-card rounded-2xl shadow-elevated p-8 space-y-6 border border-border/50 max-w-2xl mx-auto w-full">
      <div className="mb-6">
        <h1 className="text-2xl font-display font-bold text-foreground">Reports</h1>
        <p className="text-sm text-muted-foreground">Generate detailed project reports</p>
      </div>

      <Section title="Project Details">
        <SelectRow
          label="Project:"
          placeholder="Select a project..."
          options={projects.map((p) => ({ value: p.id || "", label: p.name }))}
          value={selectedProject}
          onChange={(e) => setSelectedProject(e.target.value)}
        />
      </Section>
      <div className="h-px bg-border" />
      <Section title="BOM Details">
        <SelectRow
          label="Select items:"
          placeholder="Choose items..."
          options={[
            { value: "all", label: "All" },
            ...boms.map((b) => ({ value: b.id || "", label: `${b.itemCode} - ${b.itemName}` })),
          ]}
          value={selectedBom}
          onChange={(e) => setSelectedBom(e.target.value)}
        />
      </Section>
      <div className="h-px bg-border" />
      <Section title="Date Range">
        <FieldRow
          label="Start date:"
          placeholder="dd/mm/yyyy"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          max={endDate || undefined}
        />
        <FieldRow
          label="End date:"
          placeholder="dd/mm/yyyy"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          min={startDate || undefined}
        />
      </Section>

      <div className="pt-2 space-y-2">
        <Button
          className="w-full h-12 text-base font-semibold rounded-xl shadow-card hover:shadow-elevated transition-all"
          onClick={handleRunReport}
          disabled={isRunning}
        >
          <Play className="w-4 h-4 mr-2" />
          {isRunning ? "Gerando e enviando..." : "Run Report"}
        </Button>
        <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
          <Mail className="w-3 h-3" />
          The file will be sent to your email
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
