import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { invoiceService, poService, bomService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Invoice, Po, Bom } from '../types';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
  const navigation: any = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPos: 0,
    totalBom: 0,
    variance: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [statusData, setStatusData] = useState<any[]>([]);

  const processDashboardData = (invoices: Invoice[], pos: Po[], boms: Bom[]) => {
    const totalInvoices = invoices.reduce((sum, inv) => sum + inv.qntdInvoice, 0);
    const totalPos = pos.reduce((sum, po) => sum + po.qntdInvoice, 0);
    const totalBom = boms.reduce((sum, bom) => sum + bom.qntd, 0);
    const variance = totalBom > 0 ? ((totalInvoices - totalBom) / totalBom) * 100 : 0;

    setStats({
      totalInvoices,
      totalPos,
      totalBom,
      variance,
    });

    const settledInvoices = invoices.filter(i => i.remainingQntd <= 0).length;
    const pendingInvoices = invoices.length - settledInvoices;

    setStatusData([
      { 
        name: "Settled", 
        population: settledInvoices, 
        color: "#1e8548", 
        legendFontColor: "#7F7F7F", 
        legendFontSize: 12 
      },
      { 
        name: "Pending", 
        population: pendingInvoices, 
        color: "#f2a900", 
        legendFontColor: "#7F7F7F", 
        legendFontSize: 12 
      },
    ]);

    const months: Record<string, { invoices: number, pos: number }> = {};
    const processDate = (dateStr: string | undefined) => {
      if (!dateStr) return "Current";
      const date = new Date(dateStr);
      return date.toLocaleString('default', { month: 'short' });
    };

    invoices.forEach(i => {
      const month = processDate(i.createdAt);
      if (!months[month]) months[month] = { invoices: 0, pos: 0 };
      months[month].invoices += i.qntdInvoice;
    });

    pos.forEach(p => {
      const month = processDate(p.createdAt);
      if (!months[month]) months[month] = { invoices: 0, pos: 0 };
      months[month].pos += p.qntdInvoice;
    });

    let labels = Object.keys(months);
    if (labels.length === 0) labels = ["Current"];
    if (labels.length > 6) labels = labels.slice(-6);

    const invoiceData = labels.map(m => months[m]?.invoices || (m === "Current" ? totalInvoices : 0));
    const posData = labels.map(m => months[m]?.pos || (m === "Current" ? totalPos : 0));
    const bomData = labels.map(() => totalBom);

    setMonthlyData({
      labels,
      datasets: [
        {
          data: invoiceData,
          color: (opacity = 1) => `rgba(30, 133, 72, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: posData,
          color: (opacity = 1) => `rgba(94, 191, 134, ${opacity})`,
          strokeWidth: 2
        },
        {
          data: bomData,
          color: (opacity = 1) => `rgba(145, 195, 165, ${opacity})`,
          strokeWidth: 2
        }
      ],
      legend: ["Invoices", "POs", "BOM"]
    });
  };

  const fetchData = async () => {
    try {
      const user = userStorage.getUser();
      let invoices: Invoice[] = [], pos: Po[] = [], boms: Bom[] = [];

      if (user && user.companyId) {
         [invoices, pos, boms] = await Promise.all([
          invoiceService.getByCompany(user.companyId),
          poService.getByCompany(user.companyId),
          bomService.getByCompany(user.companyId)
        ]);
      } else {
        [invoices, pos, boms] = await Promise.all([
          invoiceService.getAll(),
          poService.getAll(),
          bomService.getAll()
        ]);
      }

      processDashboardData(invoices, pos, boms);
    } catch (error) {
      console.error('Failed to fetch dashboard data', error);
      setErrorMessage(getErrorMessage(error, 'Failed to load dashboard data'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const KpiCard = ({ title, value, iconName }: { title: string; value: string; iconName: keyof typeof Ionicons.glyphMap }) => (
    <View style={styles.kpiCard}>
      <View style={styles.kpiHeader}>
        <Text style={styles.kpiLabel}>{title}</Text>
        <View style={styles.kpiIconWrap}>
          <Ionicons name={iconName} size={16} color={theme.colors.primary} />
        </View>
      </View>
      <Text style={styles.kpiValue}>{value}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.headerTitle}>Dashboard</Text>
            <Text style={styles.headerSubtitle}>Overview of your metrics</Text>
          </View>
          <TouchableOpacity
            onPress={async () => {
              await userStorage.clearUser();
              navigation.replace('Entry');
            }}
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.dashboardContainer}>
            <View style={styles.kpiContainer}>
              <KpiCard title="Total Invoices (Qty)" value={stats.totalInvoices.toLocaleString()} iconName="document-text-outline" />
              <KpiCard title="Total POs (Qty)" value={stats.totalPos.toLocaleString()} iconName="cart-outline" />
              <KpiCard title="Total BOM (Qty)" value={stats.totalBom.toLocaleString()} iconName="clipboard-outline" />
              <KpiCard title="Quantity Variance" value={`${stats.variance.toFixed(1)}%`} iconName="cash-outline" />
            </View>

            {monthlyData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Monthly Comparison</Text>
                <LineChart
                  data={monthlyData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    backgroundColor: "#ffffff",
                    backgroundGradientFrom: "#ffffff",
                    backgroundGradientTo: "#ffffff",
                    decimalPlaces: 0,
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: { borderRadius: 16 },
                    propsForDots: {
                      r: "4",
                      strokeWidth: "2",
                      stroke: "#ffa726"
                    }
                  }}
                  bezier
                  style={{
                    marginVertical: 8,
                    borderRadius: 16
                  }}
                />
              </View>
            )}

            {statusData.length > 0 && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>Invoice Status</Text>
                <PieChart
                  data={statusData}
                  width={screenWidth - 40}
                  height={220}
                  chartConfig={{
                    color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  }}
                  accessor={"population"}
                  backgroundColor={"transparent"}
                  paddingLeft={"15"}
                  center={[10, 0]}
                  absolute
                />
              </View>
            )}
          </View>
        )}
        <ErrorOverlay message={errorMessage} title="Error" onClose={() => setErrorMessage(null)} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 20,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#eee',
  },
  logoutText: {
    color: theme.colors.primary,
    fontWeight: '700',
  },
  dashboardContainer: {
    marginTop: 10,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  kpiCard: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f0f0f0',
  },
  kpiHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  kpiIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 100, 0, 0.10)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  kpiLabel: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textLight,
    textTransform: 'uppercase',
    marginRight: 8,
    fontWeight: '700',
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
});

export default Dashboard;
