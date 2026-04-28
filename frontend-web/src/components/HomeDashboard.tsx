import { DollarSign, FileText, ShoppingCart, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useEffect, useState } from "react";
import { invoiceService, poService, bomService, getCurrentBaseUrl } from "@/services/api";
import { useI18n } from "@/i18n/i18n";

const localeFromLanguage = (language: string) => {
  if (language === "pt") return "pt-BR";
  if (language === "es") return "es-ES";
  return "en-US";
};

type MonthlyChartDatum = {
  month: string;
  invoices: number;
  pos: number;
  bom: number;
};

type DashboardUser = {
  companyId?: number | null;
  companyName?: string | null;
};

const readStoredUser = (): DashboardUser | null => {
  const storages = [localStorage, sessionStorage];

  for (const storage of storages) {
    try {
      const rawUser = storage.getItem("user");
      if (!rawUser) continue;

      const parsed = JSON.parse(rawUser) as DashboardUser | null;
      if (parsed && typeof parsed === "object") {
        return parsed;
      }
    } catch {
      continue;
    }
  }

  return null;
};

const asNumber = (value: unknown): number => {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const KpiCard = ({ title, value, icon: Icon }: {
  title: string; value: string; icon: React.ElementType;
}) => (
  <div className="bg-card rounded-xl p-4 shadow-card border border-border/50 space-y-2 hover:bg-primary/5 hover:border-primary/50 hover:scale-105 hover:shadow-lg transition-all duration-300 cursor-pointer">
    <div className="flex items-center justify-between">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{title}</span>
      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
        <Icon className="w-4 h-4 text-primary" />
      </div>
    </div>
    <p className="text-2xl font-display font-bold text-foreground">{value}</p>
  </div>
);

const HomeDashboard = () => {
  const { t, language } = useI18n();
  const locale = localeFromLanguage(language);
  const formatNumber = (value: number) => new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(value);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPos: 0,
    totalBom: 0,
    variance: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyChartDatum[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState({ settled: 0, pending: 0 });

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        setErrorMessage(null);
        const user = readStoredUser();
        const companyId = user?.companyId ?? null;

        const results = await Promise.allSettled([
          companyId ? invoiceService.getByCompany(companyId) : invoiceService.getAll(),
          companyId ? poService.getByCompany(companyId) : poService.getAll(),
          companyId ? bomService.getByCompany(companyId) : bomService.getAll()
        ]);

        const [invoiceResult, poResult, bomResult] = results;
        const invoices = invoiceResult.status === "fulfilled" ? invoiceResult.value : [];
        const pos = poResult.status === "fulfilled" ? poResult.value : [];
        const boms = bomResult.status === "fulfilled" ? bomResult.value : [];
        const failedSources = [
          invoiceResult.status === "rejected" ? "faturas" : null,
          poResult.status === "rejected" ? "POs" : null,
          bomResult.status === "rejected" ? "BOM" : null,
        ].filter(Boolean) as string[];

        console.log("[Dashboard] API fetch summary", {
          baseUrl: getCurrentBaseUrl(),
          companyId,
          invoices: invoices.length,
          pos: pos.length,
          boms: boms.length,
          failedSources,
        });

        if (failedSources.length === 3) {
          throw new Error(`Nao foi possivel carregar dados do dashboard a partir de ${getCurrentBaseUrl()}.`);
        }

        if (!cancelled && failedSources.length > 0) {
          setErrorMessage(`Falha ao carregar: ${failedSources.join(", ")}.`);
        }

        const totalInvoices = invoices.reduce((sum, inv) => sum + asNumber(inv.qntdInvoice), 0);
        const totalPos = pos.reduce((sum, po) => sum + asNumber(po.qntdInvoice), 0);
        const totalBom = boms.reduce((sum, bom) => sum + asNumber(bom.qntd), 0);
        const totalInvoiceQuantity = invoices.reduce((sum, inv) => sum + asNumber(inv.qntdInvoice), 0);
        const totalBomQuantity = boms.reduce((sum, bom) => sum + asNumber(bom.qntd), 0);
        const totalInvoiceValue = invoices.reduce((sum, inv) => sum + asNumber(inv.invoiceValue), 0);
        const totalPoValue = pos.reduce((sum, po) => sum + asNumber(po.poValue), 0);
        const variance = totalPoValue > 0 ? ((totalInvoiceValue - totalPoValue) / totalPoValue) * 100 : 0;

        if (cancelled) return;

        setStats({
          totalInvoices,
          totalPos,
          totalBom,
          variance
        });

        const settledInvoices = invoices.filter((invoice) => asNumber(invoice.remainingQntd) === 0).length;
        const pendingInvoices = invoices.filter((invoice) => asNumber(invoice.remainingQntd) > 0).length;
        setInvoiceStatus({ settled: settledInvoices, pending: pendingInvoices });

        // Calculate Monthly Data
        const months: Record<string, { invoices: number; pos: number; bom: number; sortOrder: number }> = {};

        const resolveMonthKey = (...dateCandidates: Array<string | undefined>) => {
          for (const dateCandidate of dateCandidates) {
            if (!dateCandidate) continue;

            const date = new Date(dateCandidate);
            if (Number.isNaN(date.getTime())) continue;

            const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
            const month = date.toLocaleString(locale, { month: "short", year: "2-digit" });

            return {
              key,
              month,
              sortOrder: new Date(date.getFullYear(), date.getMonth(), 1).getTime(),
            };
          }

          return {
            key: "__current__",
            month: "__current__",
            sortOrder: Number.MAX_SAFE_INTEGER,
          };
        };

        invoices.forEach(i => {
          const monthMeta = resolveMonthKey(i.invoiceDateString, i.createdAt);
          if (!months[monthMeta.key]) {
            months[monthMeta.key] = { invoices: 0, pos: 0, bom: 0, sortOrder: monthMeta.sortOrder };
          }
          months[monthMeta.key].invoices += asNumber(i.qntdInvoice);
        });

        pos.forEach(p => {
          const monthMeta = resolveMonthKey(p.createdAt);
          if (!months[monthMeta.key]) {
            months[monthMeta.key] = { invoices: 0, pos: 0, bom: 0, sortOrder: monthMeta.sortOrder };
          }
          months[monthMeta.key].pos += asNumber(p.qntdInvoice);
        });

        boms.forEach((bom) => {
          const monthMeta = resolveMonthKey(bom.createdAt);
          if (!months[monthMeta.key]) {
            months[monthMeta.key] = { invoices: 0, pos: 0, bom: 0, sortOrder: monthMeta.sortOrder };
          }
          months[monthMeta.key].bom += asNumber(bom.qntd);
        });

        const chartData: MonthlyChartDatum[] = Object.entries(months)
          .sort(([, a], [, b]) => a.sortOrder - b.sortOrder)
          .map(([monthKey, data]) => ({
            month: monthKey === "__current__" ? "__current__" : new Date(`${monthKey}-01`).toLocaleString(locale, { month: "short", year: "2-digit" }),
            invoices: data.invoices,
            pos: data.pos,
            bom: data.bom,
          }));

        if (chartData.length === 0) {
          chartData.push({ month: "__current__", invoices: totalInvoiceQuantity, pos: pos.reduce((sum, po) => sum + asNumber(po.qntdInvoice), 0), bom: totalBomQuantity });
        }

        setMonthlyData(chartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
        if (!cancelled) {
          setErrorMessage(`Nao foi possivel carregar os dados do dashboard. API atual: ${getCurrentBaseUrl()}.`);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();
    return () => {
      cancelled = true;
    };
  }, [locale]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">{t("dashboard.loading")}</div>;
  }

  const totalClassifiedInvoices = invoiceStatus.settled + invoiceStatus.pending;
  const statusData = [
    {
      name: t("dashboard.status.settled"),
      value: totalClassifiedInvoices > 0 ? (invoiceStatus.settled / totalClassifiedInvoices) * 100 : 0,
      count: invoiceStatus.settled,
      color: "hsl(145, 63%, 32%)",
    },
    {
      name: t("dashboard.status.pending"),
      value: totalClassifiedInvoices > 0 ? (invoiceStatus.pending / totalClassifiedInvoices) * 100 : 0,
      count: invoiceStatus.pending,
      color: "hsl(40, 90%, 50%)",
    },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.subtitle")}</p>
      </div>
      {errorMessage && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {errorMessage}
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title={t("dashboard.kpi.totalInvoices")} value={formatNumber(stats.totalInvoices)} icon={FileText} />
        <KpiCard title={t("dashboard.kpi.totalPos")} value={formatNumber(stats.totalPos)} icon={ShoppingCart} />
        <KpiCard title={t("dashboard.kpi.totalBom")} value={formatNumber(stats.totalBom)} icon={ClipboardList} />
        <KpiCard title={t("dashboard.kpi.variance")} value={`${stats.variance.toFixed(1)}%`} icon={DollarSign} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">{t("dashboard.chart.monthlyComparison")}</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
              <XAxis
                dataKey="month"
                tick={{ fontSize: 11, fill: "hsl(150, 10%, 45%)" }}
                tickFormatter={(v) => (v === "__current__" ? t("dashboard.month.current") : v)}
              />
              <YAxis tick={{ fontSize: 11, fill: "hsl(150, 10%, 45%)" }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatNumber(value) : ''} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="invoices" name={t("dashboard.kpi.totalInvoices")} fill="hsl(145, 63%, 32%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pos" name={t("dashboard.kpi.totalPos")} fill="hsl(145, 40%, 55%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="bom" name="BOM" fill="hsl(145, 20%, 75%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">{t("dashboard.chart.invoiceStatus")}</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: number | undefined, _name, item) =>
                  value !== undefined
                    ? t("dashboard.tooltip.invoiceStatusPercent", {
                        percent: value.toFixed(1),
                        count: typeof item?.payload?.count === "number" ? item.payload.count : 0,
                      })
                    : ""
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
             {statusData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                   <span className="text-xs text-muted-foreground">{entry.name} ({entry.value.toFixed(1)}%)</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
