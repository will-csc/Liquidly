import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Alert,
  Platform
} from 'react-native';
import * as Sharing from 'expo-sharing';
import { theme } from '../styles/theme';
import { useI18n } from '../i18n/i18n';
import { projectService, bomService, invoiceService, poService, liquidationResultService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Project, Bom, Invoice, Po } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import Card from '../components/Card';
import IconNote from '../components/IconNote';
import ModalHeader from '../components/ModalHeader';
import ScreenHeader from '../components/ScreenHeader';
import SelectableListItem from '../components/SelectableListItem';
import SelectField from '../components/SelectField';

interface SelectionItem {
  label: string;
  value: string | number;
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const Report = () => {
  const { t } = useI18n();
  const [projects, setProjects] = useState<Project[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pos, setPos] = useState<Po[]>([]);
  const [loading, setLoading] = useState(false);
  const [runningReport, setRunningReport] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [selectedProject, setSelectedProject] = useState<SelectionItem | null>(null);
  const [selectedBom, setSelectedBom] = useState<SelectionItem | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalData, setModalData] = useState<SelectionItem[]>([]);
  const [currentSelectionType, setCurrentSelectionType] = useState<'project' | 'bom' | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let projectsData: Project[] = [], bomsData: Bom[] = [], invoicesData: Invoice[] = [], posData: Po[] = [];

      if (user && user.companyId) {
        [projectsData, bomsData, invoicesData, posData] = await Promise.all([
          projectService.getByCompany(user.companyId),
          bomService.getByCompany(user.companyId),
          invoiceService.getByCompany(user.companyId),
          poService.getByCompany(user.companyId),
        ]);
      } else {
        [projectsData, bomsData, invoicesData, posData] = await Promise.all([
          projectService.getAll(),
          bomService.getAll(),
          invoiceService.getAll(),
          poService.getAll(),
        ]);
      }

      setProjects(projectsData);
      setBoms(bomsData);
      setInvoices(invoicesData);
      setPos(posData);
    } catch (error) {
      console.error('Failed to fetch report data', error);
      setErrorMessage(getErrorMessage(error, t('report.loadFailed')));
    } finally {
      setLoading(false);
    }
  };

  const openSelectionModal = (type: 'project' | 'bom') => {
    setCurrentSelectionType(type);
    if (type === 'project') {
      setModalTitle(t('report.modal.selectProject'));
      setModalData(projects.map(p => ({ label: p.name, value: p.id || '' })));
    } else {
      setModalTitle(t('report.modal.selectBom'));
      const filteredBoms = selectedProject?.value
        ? boms.filter((bom) => bom.project?.id === selectedProject.value)
        : boms;
      setModalData(filteredBoms.map(b => ({ label: `${b.itemCode} - ${b.itemName}`, value: b.id || '' })));
    }
    setModalVisible(true);
  };

  const handleSelect = (item: SelectionItem) => {
    if (currentSelectionType === 'project') {
      setSelectedProject(item);
      setSelectedBom(null);
    } else {
      setSelectedBom(item);
    }
    setModalVisible(false);
  };

  const openDownloadedReport = async (uri: string) => {
    if (Platform.OS === 'web') {
      return t('report.runSuccess');
    }

    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        dialogTitle: t('report.shareTitle'),
      });
      return t('report.runSuccess');
    }

    return t('report.runSuccessNoShare');
  };

  const pollReportProgress = async (jobId: string, companyId: number): Promise<string> => {
    for (let attempt = 0; attempt < 300; attempt += 1) {
      const status = await liquidationResultService.getReportStatus(jobId, companyId);
      if (!isMountedRef.current) return t('report.runFailed');

      if (status.status === 'completed') {
        const { uri } = await liquidationResultService.downloadReport(jobId, companyId);
        return await openDownloadedReport(uri);
      }

      if (status.status === 'failed') {
        throw new Error(status.errorMessage || status.message || t('report.runFailed'));
      }

      await wait(1200);
    }

    throw new Error(t('report.runTimeout'));
  };

  const handleRunReport = async () => {
    const user = userStorage.getUser();
    if (!user || !user.companyId) {
      setErrorMessage(t('report.loginRequired'));
      return;
    }
    if (!selectedProject?.value) {
      setErrorMessage(t('report.projectRequired'));
      return;
    }

    const selectedProjectId = Number(selectedProject.value);
    const projectBoms = boms.filter(
      (bom) => bom.project?.id === selectedProjectId || bom.projectName === selectedProject.label
    );
    const projectInvoices = invoices.filter((invoice) => invoice.project?.id === selectedProjectId);

    if (projectInvoices.length === 0) {
      setErrorMessage(t('report.noInvoices'));
      return;
    }

    if (pos.length === 0) {
      setErrorMessage(t('report.noPos'));
      return;
    }

    if (projectBoms.length === 0) {
      setErrorMessage(t('report.noBomData'));
      return;
    }

    setRunningReport(true);
    try {
      const job = await liquidationResultService.runReport({
        companyId: user.companyId,
        projectId: selectedProjectId,
        selectedBom: selectedBom?.value ? String(selectedBom.value) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });
      const successMessage = await pollReportProgress(job.jobId, user.companyId);
      Alert.alert(t('common.success'), successMessage);
    } catch (error: any) {
      console.error('Failed to run report:', error);
      setErrorMessage(getErrorMessage(error, t('report.runFailed')));
    } finally {
      setRunningReport(false);
    }
  };

  const isSelected = (item: SelectionItem) =>
    (currentSelectionType === 'project' && selectedProject?.value === item.value) ||
    (currentSelectionType === 'bom' && selectedBom?.value === item.value);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title={t('report.title')}
          subtitle={t('report.subtitle')}
          style={{ marginBottom: 20 }}
        />

        <Card style={styles.card}>
          <SelectField
            label={t('report.section.projectDetails')}
            valueText={selectedProject ? selectedProject.label : undefined}
            placeholder={t('report.placeholder.selectProject')}
            onPress={() => openSelectionModal('project')}
          />

          <View style={styles.divider} />

          <SelectField
            label={t('report.section.bomDetails')}
            valueText={selectedBom ? selectedBom.label : undefined}
            placeholder={t('report.placeholder.chooseItems')}
            onPress={() => openSelectionModal('bom')}
          />

          <View style={styles.divider} />

          <Text style={styles.sectionTitle}>{t('report.section.dateRange')}</Text>
          <Input
            label={t('report.label.startDate')}
            placeholder="DD/MM/YYYY"
            value={startDate}
            onChangeText={setStartDate}
          />
          <Input
            label={t('report.label.endDate')}
            placeholder="DD/MM/YYYY"
            value={endDate}
            onChangeText={setEndDate}
          />

          <View style={styles.buttonContainer}>
            <Button
              title={runningReport ? t('report.button.running') : t('report.button.run')}
              onPress={handleRunReport}
              loading={runningReport}
            />
            <IconNote iconName="download-outline" text={t('report.helper.download')} />
          </View>
        </Card>

      </ScrollView>

      {/* Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ModalHeader title={modalTitle} onClose={() => setModalVisible(false)} />
            <FlatList
              data={modalData}
              renderItem={({ item }) => (
                <SelectableListItem label={item.label} selected={isSelected(item)} onPress={() => handleSelect(item)} />
              )}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
            />
          </View>
        </View>
      </Modal>
      <ErrorOverlay message={errorMessage} title={t('common.error')} onClose={() => setErrorMessage(null)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: theme.colors.textLight,
  },
  card: {
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalList: {
    padding: 20,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default Report;
