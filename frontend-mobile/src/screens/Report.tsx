import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  Modal, 
  FlatList,
  Alert
} from 'react-native';
import { theme } from '../styles/theme';
import { projectService, bomService, liquidationResultService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Project, Bom } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import { Ionicons } from '@expo/vector-icons';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';

interface SelectionItem {
  label: string;
  value: string | number;
}

const Report = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(false);
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

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let projectsData: Project[] = [], bomsData: Bom[] = [];

      if (user && user.companyId) {
        [projectsData, bomsData] = await Promise.all([
          projectService.getByCompany(user.companyId),
          bomService.getByCompany(user.companyId),
        ]);
      } else {
        [projectsData, bomsData] = await Promise.all([
          projectService.getAll(),
          bomService.getAll(),
        ]);
      }

      setProjects(projectsData);
      setBoms(bomsData);
    } catch (error) {
      console.error('Failed to fetch report data', error);
      setErrorMessage(getErrorMessage(error, 'Failed to load data for report'));
    } finally {
      setLoading(false);
    }
  };

  const openSelectionModal = (type: 'project' | 'bom') => {
    setCurrentSelectionType(type);
    if (type === 'project') {
      setModalTitle('Select Project');
      setModalData(projects.map(p => ({ label: p.name, value: p.id || '' })));
    } else {
      setModalTitle('Select BOM Item');
      setModalData(boms.map(b => ({ label: `${b.itemCode} - ${b.itemName}`, value: b.id || '' })));
    }
    setModalVisible(true);
  };

  const handleSelect = (item: SelectionItem) => {
    if (currentSelectionType === 'project') {
      setSelectedProject(item);
    } else {
      setSelectedBom(item);
    }
    setModalVisible(false);
  };

  const handleRunReport = async () => {
    const user = userStorage.getUser();
    if (!user || !user.companyId || !user.email) {
      setErrorMessage('Please log in again to run reports');
      return;
    }
    if (!selectedProject?.value) {
      setErrorMessage('Please select a project');
      return;
    }

    setLoading(true);
    try {
      await liquidationResultService.runReport({
        companyId: user.companyId,
        projectId: Number(selectedProject.value),
        email: user.email,
        selectedBom: selectedBom?.value ? String(selectedBom.value) : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined
      });

      Alert.alert('Success', 'Report sent to your email');
    } catch (error: any) {
      console.error('Failed to run report:', error);
      setErrorMessage(getErrorMessage(error, 'Failed to run report'));
    } finally {
      setLoading(false);
    }
  };

  const renderSelectionItem = ({ item }: { item: SelectionItem }) => (
    <TouchableOpacity 
      style={styles.modalItem} 
      onPress={() => handleSelect(item)}
    >
      <Text style={styles.modalItemText}>{item.label}</Text>
      {((currentSelectionType === 'project' && selectedProject?.value === item.value) ||
        (currentSelectionType === 'bom' && selectedBom?.value === item.value)) && (
        <Ionicons name="checkmark" size={20} color={theme.colors.primary} />
      )}
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Reports</Text>
          <Text style={styles.headerSubtitle}>Generate detailed project reports</Text>
        </View>

        <View style={styles.card}>
          {/* Project Selection */}
          <Text style={styles.sectionTitle}>Project Details</Text>
          <TouchableOpacity 
            style={styles.selectInput} 
            onPress={() => openSelectionModal('project')}
          >
            <Text style={[styles.selectText, !selectedProject && styles.placeholderText]}>
              {selectedProject ? selectedProject.label : 'Select a project...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* BOM Selection */}
          <Text style={styles.sectionTitle}>BOM Details</Text>
          <TouchableOpacity 
            style={styles.selectInput} 
            onPress={() => openSelectionModal('bom')}
          >
            <Text style={[styles.selectText, !selectedBom && styles.placeholderText]}>
              {selectedBom ? selectedBom.label : 'Choose items...'}
            </Text>
            <Ionicons name="chevron-down" size={20} color="#666" />
          </TouchableOpacity>

          <View style={styles.divider} />

          {/* Date Range */}
          <Text style={styles.sectionTitle}>Date Range</Text>
          <Input 
            label="Start Date" 
            placeholder="DD/MM/YYYY" 
            value={startDate}
            onChangeText={setStartDate}
          />
          <Input 
            label="End Date" 
            placeholder="DD/MM/YYYY" 
            value={endDate}
            onChangeText={setEndDate}
          />

          <View style={styles.buttonContainer}>
            <Button 
              title="Run Report" 
              onPress={handleRunReport} 
              loading={loading}
            />
            <View style={styles.emailNote}>
              <Ionicons name="mail-outline" size={14} color="#666" />
              <Text style={styles.emailText}>The file will be sent to your email</Text>
            </View>
          </View>
        </View>

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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{modalTitle}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={modalData}
              renderItem={renderSelectionItem}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.modalList}
            />
          </View>
        </View>
      </Modal>
      <ErrorOverlay message={errorMessage} title="Error" onClose={() => setErrorMessage(null)} />
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
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: 10,
    marginTop: 10,
  },
  selectInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 10,
    padding: 12,
    backgroundColor: '#fff',
    marginBottom: 15,
  },
  selectText: {
    fontSize: 16,
    color: theme.colors.text,
  },
  placeholderText: {
    color: '#999',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginVertical: 10,
  },
  buttonContainer: {
    marginTop: 20,
  },
  emailNote: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  emailText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalList: {
    padding: 20,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: {
    fontSize: 16,
    color: theme.colors.text,
  },
});

export default Report;
