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

  const isSelected = (item: SelectionItem) =>
    (currentSelectionType === 'project' && selectedProject?.value === item.value) ||
    (currentSelectionType === 'bom' && selectedBom?.value === item.value);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ScreenHeader
          title="Reports"
          subtitle="Generate detailed project reports"
          style={{ marginBottom: 20 }}
        />

        <Card style={styles.card}>
          <SelectField
            label="Project Details"
            valueText={selectedProject ? selectedProject.label : undefined}
            placeholder="Select a project..."
            onPress={() => openSelectionModal('project')}
          />

          <View style={styles.divider} />

          <SelectField
            label="BOM Details"
            valueText={selectedBom ? selectedBom.label : undefined}
            placeholder="Choose items..."
            onPress={() => openSelectionModal('bom')}
          />

          <View style={styles.divider} />

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
            <IconNote iconName="mail-outline" text="The file will be sent to your email" />
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
