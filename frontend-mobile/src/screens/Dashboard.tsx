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
  FlatList,
  Modal,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { theme } from '../styles/theme';
import { invoiceService, poService, bomService, userService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Invoice, Po, Bom } from '../types';
import { LineChart, PieChart } from 'react-native-chart-kit';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import { useI18n } from '../i18n/i18n';
import type { Language } from '../i18n/translations';
import ChartCard from '../components/ChartCard';
import KpiCard from '../components/KpiCard';
import ModalHeader from '../components/ModalHeader';
import ScreenHeader from '../components/ScreenHeader';
import SelectableListItem from '../components/SelectableListItem';

const screenWidth = Dimensions.get('window').width;

const Dashboard = () => {
  const navigation: any = useNavigation();
  const { language, setLanguage, t } = useI18n();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  const [pendingDeleteUserId, setPendingDeleteUserId] = useState<number | null>(null);
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
    const totalInvoiceValue = invoices.reduce((sum, inv) => sum + (inv.invoiceValue ?? 0), 0);
    const totalPoValue = pos.reduce((sum, po) => sum + (po.poValue ?? 0), 0);
    const variance = totalPoValue > 0 ? ((totalInvoiceValue - totalPoValue) / totalPoValue) * 100 : 0;

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

  const goToEntry = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'Entry' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.colors.primary]} />
        }
      >
        <ScreenHeader
          title={t('dashboard.title')}
          subtitle={t('dashboard.subtitle')}
          style={styles.header}
        />
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => setLanguageModalVisible(true)}
            style={[styles.actionButton, styles.languageButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
            disabled={isDeletingAccount}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIconWrap, styles.languageIconWrap]}>
                <Ionicons name="language-outline" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.compactActionLabel}>{t('language.title')}</Text>
            </View>
            <Text style={styles.compactActionValue}>{currentLanguageLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              if (isDeletingAccount) return;
              const user = userStorage.getUser();
              if (!user?.id) {
                setErrorMessage(t('dashboard.userNotFound'));
                return;
              }
              setPendingDeleteUserId(user.id);
              setDeleteModalVisible(true);
            }}
            style={[styles.actionButton, styles.deleteButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
            disabled={isDeletingAccount}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIconWrap, styles.deleteIconWrap]}>
                <Ionicons name="trash-outline" size={16} color="#d92d20" />
              </View>
              <Text style={styles.compactActionLabel}>{t('dashboard.deleteAccount')}</Text>
            </View>
            <Text style={styles.compactActionValue}>
              {isDeletingAccount ? t('dashboard.deleting') : t('common.delete')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={async () => {
              if (isDeletingAccount) return;
              await userStorage.clearUser();
              goToEntry();
            }}
            style={[styles.actionButton, styles.logoutButton, isDeletingAccount ? styles.actionButtonDisabled : null]}
            disabled={isDeletingAccount}
          >
            <View style={styles.actionContent}>
              <View style={[styles.actionIconWrap, styles.logoutIconWrap]}>
                <Ionicons name="log-out-outline" size={16} color={theme.colors.primary} />
              </View>
              <Text style={styles.compactActionLabel}>{t('dashboard.logout')}</Text>
            </View>
            <Text style={styles.compactActionValue}>{t('dashboard.logout')}</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingState}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={styles.loadingText}>{t('common.loading')}</Text>
          </View>
        ) : (
          <View style={styles.dashboardContainer}>
            <View style={styles.kpiContainer}>
              <KpiCard title={t('dashboard.kpi.totalInvoices')} value={stats.totalInvoices.toLocaleString()} iconName="document-text-outline" />
              <KpiCard title={t('dashboard.kpi.totalPos')} value={stats.totalPos.toLocaleString()} iconName="cart-outline" />
              <KpiCard title={t('dashboard.kpi.totalBom')} value={stats.totalBom.toLocaleString()} iconName="clipboard-outline" />
              <KpiCard title={t('dashboard.kpi.variance')} value={`${stats.variance.toFixed(1)}%`} iconName="cash-outline" />
            </View>

            {monthlyData && (
              <ChartCard title={t('dashboard.chart.monthlyComparison')}>
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
              </ChartCard>
            )}

            {statusData.length > 0 && (
              <ChartCard title={t('dashboard.chart.invoiceStatus')}>
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
              </ChartCard>
            )}
          </View>
        )}
        <ErrorOverlay message={errorMessage} title={t('common.error')} onClose={() => setErrorMessage(null)} />
      </ScrollView>

      <Modal visible={deleteModalVisible} transparent animationType="fade" onRequestClose={() => setDeleteModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ModalHeader title={t('dashboard.deleteConfirmTitle')} onClose={() => setDeleteModalVisible(false)} />
            <View style={styles.confirmBody}>
              <Text style={styles.confirmText}>{t('dashboard.deleteConfirmBody')}</Text>
              <View style={styles.confirmActions}>
                <TouchableOpacity
                  onPress={() => setDeleteModalVisible(false)}
                  style={[styles.confirmButton, styles.confirmCancel]}
                  disabled={isDeletingAccount}
                >
                  <Text style={[styles.confirmButtonText, styles.confirmCancelText]}>{t('common.cancel')}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={async () => {
                    if (isDeletingAccount) return;
                    if (!pendingDeleteUserId) {
                      setErrorMessage(t('dashboard.userNotFound'));
                      setDeleteModalVisible(false);
                      return;
                    }
                    setIsDeletingAccount(true);
                    try {
                      await userService.delete(pendingDeleteUserId);
                      await userStorage.clearUser();
                      setDeleteModalVisible(false);
                      goToEntry();
                    } catch (error) {
                      setErrorMessage(getErrorMessage(error, 'Falha ao excluir a conta'));
                    } finally {
                      setIsDeletingAccount(false);
                    }
                  }}
                  style={[styles.confirmButton, styles.confirmDelete, isDeletingAccount ? styles.actionButtonDisabled : null]}
                  disabled={isDeletingAccount}
                >
                  <Text style={styles.confirmButtonText}>{isDeletingAccount ? t('dashboard.deleting') : t('dashboard.deleteAccount')}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={languageModalVisible} transparent animationType="fade" onRequestClose={() => setLanguageModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ModalHeader title={t('language.title')} onClose={() => setLanguageModalVisible(false)} />
            <FlatList
              data={languageOptions}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <SelectableListItem
                  label={item.label}
                  selected={item.value === language}
                  onPress={() => {
                    setLanguage(item.value);
                    setLanguageModalVisible(false);
                  }}
                />
              )}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              contentContainerStyle={styles.modalList}
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
  header: {
    marginBottom: 12,
  },
  headerActions: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  actionButton: {
    flex: 1,
    minHeight: 76,
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderWidth: 1,
  },
  actionButtonDisabled: {
    opacity: 0.6,
  },
  deleteButton: {
    backgroundColor: '#fff7f6',
    borderColor: '#f4c7c3',
  },
  logoutButton: {
    backgroundColor: '#f6fbf8',
    borderColor: '#cfe5d8',
  },
  languageButton: {
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  actionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  languageIconWrap: {
    backgroundColor: '#edf7f0',
  },
  deleteIconWrap: {
    backgroundColor: '#fdecec',
  },
  logoutIconWrap: {
    backgroundColor: '#edf7f0',
  },
  compactActionLabel: {
    color: theme.colors.text,
    fontWeight: '700',
    fontSize: 12,
    textAlign: 'center',
  },
  compactActionValue: {
    color: theme.colors.textLight,
    fontSize: 12,
    marginTop: 6,
    textAlign: 'center',
  },
  languageText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginTop: 2,
  },
  dashboardContainer: {
    marginTop: 10,
  },
  loadingState: {
    marginTop: 50,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textLight,
    fontSize: 14,
  },
  kpiContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
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
    padding: 0,
  },
  modalList: {
    paddingHorizontal: 14,
    paddingBottom: 12,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#f2f2f2',
  },
  confirmBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
  },
  confirmText: {
    color: theme.colors.text,
    lineHeight: 20,
  },
  confirmActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmCancel: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmCancelText: {
    color: theme.colors.text,
  },
  confirmDelete: {
    backgroundColor: '#d92d20',
  },
  confirmButtonText: {
    color: '#fff',
    fontWeight: '700',
  },
});

export default Dashboard;
