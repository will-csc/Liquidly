import { DollarSign, FileText, ShoppingCart, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useEffect, useState } from "react";
import { invoiceService, poService, bomService } from "@/services/api";
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

const sameCompany = (recordCompanyId: number | undefined, companyId: number | null) => {
  if (companyId == null) return true;
  return recordCompanyId === companyId;
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
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPos: 0,
    totalBom: 0,
    variance: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyChartDatum[]>([]);
  const [invoiceStatus, setInvoiceStatus] = useState({ settled: 0, pending: 0 });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const user = readStoredUser();
        const companyId = user?.companyId ?? null;

        const [invoiceResponse, poResponse, bomResponse] = await Promise.all([
          companyId ? invoiceService.getByCompany(companyId) : invoiceService.getAll(),
          companyId ? poService.getByCompany(companyId) : poService.getAll(),
          companyId ? bomService.getByCompany(companyId) : bomService.getAll()
        ]);

        const invoices = invoiceResponse.filter((invoice) => sameCompany(invoice.company?.id, companyId));
        const pos = poResponse.filter((po) => sameCompany(po.company?.id, companyId));
        const boms = bomResponse.filter((bom) => sameCompany(bom.company?.id, companyId));

        // Calculate Totals
        const totalInvoices = invoices.reduce((sum, inv) => sum + asNumber(inv.qntdInvoice), 0);
        const totalPos = pos.reduce((sum, po) => sum + asNumber(po.qntdInvoice), 0);
        const totalBom = boms.reduce((sum, bom) => sum + asNumber(bom.qntd), 0);
        const variance = totalBom > 0 ? ((totalInvoices - totalBom) / totalBom) * 100 : 0;

        setStats({
          totalInvoices,
          totalPos,
          totalBom,
          variance
        });

        // Calculate Status (Settled vs Pending based on remaining quantity)
        const settledInvoices = invoices.filter((i) => asNumber(i.remainingQntd) <= 0).length;
        const pendingInvoices = invoices.length - settledInvoices;
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
          chartData.push({ month: "__current__", invoices: totalInvoices, pos: totalPos, bom: totalBom });
        }

        setMonthlyData(chartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [locale]);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">{t("dashboard.loading")}</div>;
  }

  const statusData = [
    { name: t("dashboard.status.settled"), value: invoiceStatus.settled, color: "hsl(145, 63%, 32%)" },
    { name: t("dashboard.status.pending"), value: invoiceStatus.pending, color: "hsl(40, 90%, 50%)" },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">{t("dashboard.title")}</h1>
        <p className="text-sm text-muted-foreground mt-0.5">{t("dashboard.subtitle")}</p>
      </div>

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
                formatter={(value: number | undefined) =>
                  value !== undefined ? t("dashboard.tooltip.invoicesCount", { count: value }) : ""
                }
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
             {statusData.map((entry, i) => (
                <div key={i} className="flex items-center gap-1">
                   <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                   <span className="text-xs text-muted-foreground">{entry.name}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomeDashboard;
