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
  Alert,
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { theme } from '../styles/theme';
import { invoiceService, poService, bomService, userService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Invoice, Po, Bom } from '../types';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import { useI18n } from '../i18n/i18n';
import type { Language } from '../i18n/translations';

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
  const navigation: any = useNavigation();
  const { language, setLanguage, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);
  const [stats, setStats] = useState({
    totalInvoices: 0,
    totalPos: 0,
    totalBom: 0,
    variance: 0,
  });
  const [monthlyData, setMonthlyData] = useState<any>(null);
  const [statusData, setStatusData] = useState<any[]>([]);

  const languageOptions: Array<{ value: Language; label: string }> = [
    { value: 'pt', label: t('language.portuguese') },
    { value: 'en', label: t('language.english') },
    { value: 'es', label: t('language.spanish') },
  ];

  const currentLanguageLabel =
    language === 'pt' ? t('language.portuguese') : language === 'es' ? t('language.spanish') : t('language.english');

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
        name: t('dashboard.status.settled'),
        population: settledInvoices, 
        color: "#1e8548", 
        legendFontColor: "#7F7F7F", 
        legendFontSize: 12 
      },
      { 
        name: t('dashboard.status.pending'),
        population: pendingInvoices, 
        color: "#f2a900", 
        legendFontColor: "#7F7F7F", 
        legendFontSize: 12 
      },
    ]);

    const months: Record<string, { invoices: number, pos: number }> = {};
    const processDate = (dateStr: string | undefined) => {
      if (!dateStr) return t('dashboard.month.current');
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
    if (labels.length === 0) labels = [t('dashboard.month.current')];
    if (labels.length > 6) labels = labels.slice(-6);

    const currentKey = t('dashboard.month.current');
    const invoiceData = labels.map(m => months[m]?.invoices || (m === currentKey ? totalInvoices : 0));
    const posData = labels.map(m => months[m]?.pos || (m === currentKey ? totalPos : 0));
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
      legend: [t('dashboard.legend.invoices'), t('dashboard.legend.pos'), t('dashboard.legend.bom')]
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
            <Text style={styles.headerTitle}>{t('dashboard.title')}</Text>
            <Text style={styles.headerSubtitle}>{t('dashboard.subtitle')}</Text>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              onPress={() => setLanguageModalVisible(true)}
              style={[styles.actionButton, styles.languageButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
              disabled={isDeletingAccount}
            >
              <Text style={styles.languageText}>
                {t('language.title')}: {currentLanguageLabel}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => {
                if (isDeletingAccount) return;
                const user = userStorage.getUser();
                if (!user?.id) {
                  Alert.alert(t('common.error'), t('dashboard.userNotFound'));
                  return;
                }

                Alert.alert(
                  t('dashboard.deleteConfirmTitle'),
                  t('dashboard.deleteConfirmBody'),
                  [
                    { text: t('common.cancel'), style: 'cancel' },
                    {
                      text: t('dashboard.deleteAccount'),
                      style: 'destructive',
                      onPress: async () => {
                        setIsDeletingAccount(true);
                        try {
                          await userService.delete(user.id);
                          await userStorage.clearUser();
                          navigation.replace('Entry');
                        } catch (error) {
                          setErrorMessage(getErrorMessage(error, 'Falha ao excluir a conta'));
                        } finally {
                          setIsDeletingAccount(false);
                        }
                      },
                    },
                  ]
                );
              }}
              style={[styles.actionButton, styles.deleteButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
              disabled={isDeletingAccount}
            >
              <Text style={styles.actionText}>
                {isDeletingAccount ? t('dashboard.deleting') : t('dashboard.deleteAccount')}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={async () => {
                if (isDeletingAccount) return;
                await userStorage.clearUser();
                navigation.replace('Entry');
              }}
              style={[styles.actionButton, styles.logoutButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
              disabled={isDeletingAccount}
            >
              <Text style={styles.actionText}>{t('dashboard.logout')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 50 }} />
        ) : (
          <View style={styles.dashboardContainer}>
            <View style={styles.kpiContainer}>
              <KpiCard title={t('dashboard.kpi.totalInvoices')} value={stats.totalInvoices.toLocaleString()} iconName="document-text-outline" />
              <KpiCard title={t('dashboard.kpi.totalPos')} value={stats.totalPos.toLocaleString()} iconName="cart-outline" />
              <KpiCard title={t('dashboard.kpi.totalBom')} value={stats.totalBom.toLocaleString()} iconName="clipboard-outline" />
              <KpiCard title={t('dashboard.kpi.variance')} value={`${stats.variance.toFixed(1)}%`} iconName="cash-outline" />
            </View>

            {monthlyData && (
              <View style={styles.chartCard}>
                <Text style={styles.chartTitle}>{t('dashboard.chart.monthlyComparison')}</Text>
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
                <Text style={styles.chartTitle}>{t('dashboard.chart.invoiceStatus')}</Text>
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

      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t('language.title')}</Text>
              <TouchableOpacity onPress={() => setLanguageModalVisible(false)} accessibilityRole="button">
                <Ionicons name="close" size={22} color={theme.colors.text} />
              </TouchableOpacity>
            </View>
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => {
                    setLanguage(item.value);
                    setLanguageModalVisible(false);
                  }}
                  style={styles.modalItem}
                  accessibilityRole="button"
                >
                  <Text style={styles.modalItemText}>{item.label}</Text>
                  {item.value === language ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
                  ) : null}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </View>
      </Modal>
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
  headerActions: {
    alignItems: 'flex-end',
  },
  headerSubtitle: {
    fontSize: 16,
    color: theme.colors.textLight,
    marginBottom: 20,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: '#d92d20',
    marginBottom: 8,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
  },
  languageButton: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
    marginBottom: 8,
  },
  actionText: {
    color: '#fff',
    fontWeight: '700',
  },
  languageText: {
    color: theme.colors.text,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.text,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalItemText: {
    fontSize: 15,
    color: theme.colors.text,
    fontWeight: '600',
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#f2f2f2',
  },
});

export default Dashboard;
