import { DollarSign, FileText, ShoppingCart, ClipboardList } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { useEffect, useState } from "react";
import { invoiceService, poService, bomService } from "@/services/api";

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);

type MonthlyChartDatum = {
  month: string;
  invoices: number;
  pos: number;
  bom: number;
};

type StatusDatum = {
  name: string;
  value: number;
  color: string;
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
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPos: 0,
    totalBom: 0,
    variance: 0
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyChartDatum[]>([]);
  const [statusData, setStatusData] = useState<StatusDatum[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userStr = localStorage.getItem('user');
        const user = userStr ? JSON.parse(userStr) : null;
        const companyId = user?.companyId;

        const [invoices, pos, boms] = await Promise.all([
          companyId ? invoiceService.getByCompany(companyId) : invoiceService.getAll(),
          companyId ? poService.getByCompany(companyId) : poService.getAll(),
          companyId ? bomService.getByCompany(companyId) : bomService.getAll()
        ]);

        // Calculate Totals
        const totalInvoices = invoices.reduce((sum, inv) => sum + inv.qntdInvoice, 0);
        const totalPos = pos.reduce((sum, po) => sum + po.qntdInvoice, 0);
        const totalBom = boms.reduce((sum, bom) => sum + bom.qntd, 0);
        const variance = totalBom > 0 ? ((totalInvoices - totalBom) / totalBom) * 100 : 0;

        setStats({
          totalInvoices,
          totalPos,
          totalBom,
          variance
        });

        // Calculate Status (Settled vs Pending based on remaining quantity)
        // Assuming settled means remainingQntd is 0 or low
        const settledInvoices = invoices.filter(i => i.remainingQntd <= 0).length;
        const pendingInvoices = invoices.length - settledInvoices;
        
        setStatusData([
          { name: "Settled", value: settledInvoices, color: "hsl(145, 63%, 32%)" },
          { name: "Pending", value: pendingInvoices, color: "hsl(40, 90%, 50%)" },
        ]);

        // Calculate Monthly Data
        // Group by month. Since we might not have dates for everything or they might be all new, 
        // we'll try to use createdAt. If missing, we'll dump in "Current".
        const months: Record<string, { invoices: number; pos: number; bom: number }> = {};
        
        const processDate = (dateStr: string | undefined) => {
           if (!dateStr) return "Current";
           const date = new Date(dateStr);
           return date.toLocaleString('default', { month: 'short' });
        };

        invoices.forEach(i => {
          const month = processDate(i.createdAt);
          if (!months[month]) months[month] = { invoices: 0, pos: 0, bom: 0 };
          months[month].invoices += i.qntdInvoice;
        });

        pos.forEach(p => {
          const month = processDate(p.createdAt);
          if (!months[month]) months[month] = { invoices: 0, pos: 0, bom: 0 };
          months[month].pos += p.qntdInvoice;
        });

        // BOM usually doesn't have a date like invoice, but let's assume it's constant or distributed.
        // For chart purposes, we can just show BOM total in "Current" or distribute it.
        // Let's just put it in current month if we have data, or spread it.
        // Actually, without dates on BOM, we can't trend it easily. 
        // We'll just show BOM as a reference line or bar in the months where we have activity.
        
        // Convert to array
        const chartData: MonthlyChartDatum[] = Object.entries(months).map(([month, data]) => ({
          month,
          ...data
        }));
        
        // If empty (no dates), create a dummy "Current"
        if (chartData.length === 0) {
            chartData.push({ month: "Current", invoices: totalInvoices, pos: totalPos, bom: totalBom });
        }

        setMonthlyData(chartData);

      } catch (error) {
        console.error("Failed to fetch dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading dashboard data...</div>;
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-display font-bold text-foreground">Liquidation Critical Analysis</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Invoices × POs × BOM — Consolidated View</p>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard title="Total Invoices (Qty)" value={formatNumber(stats.totalInvoices)} icon={FileText} />
        <KpiCard title="Total POs (Qty)" value={formatNumber(stats.totalPos)} icon={ShoppingCart} />
        <KpiCard title="Total BOM (Qty)" value={formatNumber(stats.totalBom)} icon={ClipboardList} />
        <KpiCard title="Quantity Variance" value={`${stats.variance.toFixed(1)}%`} icon={DollarSign} />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Bar Chart */}
        <div className="lg:col-span-2 bg-card rounded-xl p-5 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Monthly Comparison (Quantity)</h3>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(150, 15%, 88%)" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(150, 10%, 45%)" }} />
              <YAxis tick={{ fontSize: 11, fill: "hsl(150, 10%, 45%)" }} tickFormatter={(v) => formatNumber(v)} />
              <Tooltip formatter={(value: number | undefined) => value !== undefined ? formatNumber(value) : ''} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="invoices" name="Invoices" fill="hsl(145, 63%, 32%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="pos" name="POs" fill="hsl(145, 40%, 55%)" radius={[3, 3, 0, 0]} />
              <Bar dataKey="bom" name="BOM" fill="hsl(145, 20%, 75%)" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div className="bg-card rounded-xl p-5 shadow-card border border-border/50">
          <h3 className="font-display font-semibold text-sm text-foreground mb-4">Invoice Status</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={statusData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {statusData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value: number | undefined) => value !== undefined ? `${value} invoices` : ''} />
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
