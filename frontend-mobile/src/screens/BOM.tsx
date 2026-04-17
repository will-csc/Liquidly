import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { theme } from '../styles/theme';
import { useI18n } from '../i18n/i18n';
import { bomService, projectService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Bom, Project } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import Card from '../components/Card';
import ModalHeader from '../components/ModalHeader';
import PillActionButton from '../components/PillActionButton';
import ScreenHeader from '../components/ScreenHeader';
import SelectField from '../components/SelectField';
import SelectableListItem from '../components/SelectableListItem';

interface SelectionItem {
  label: string;
  value: number;
}

const BOM = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<Bom[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Bom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);

  // Form State
  const [selectedProject, setSelectedProject] = useState<SelectionItem | null>(null);
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');

  const projectOptions = useMemo(
    () =>
      projects
        .filter((project): project is Project & { id: number } => typeof project.id === 'number')
        .map((project) => ({ label: project.name, value: project.id })),
    [projects]
  );

  const findProjectSelection = (item?: Bom | null) => {
    if (!item) return null;

    if (typeof item.project?.id === 'number') {
      const matchedProject = projects.find((project) => project.id === item.project?.id);
      if (matchedProject?.id) {
        return { label: matchedProject.name, value: matchedProject.id };
      }
    }

    if (item.projectName) {
      const matchedProject = projects.find((project) => project.name === item.projectName);
      if (matchedProject?.id) {
        return { label: matchedProject.name, value: matchedProject.id };
      }
    }

    return null;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let bomData: Bom[] = [];
      let projectData: Project[] = [];
      if (user && user.companyId) {
        [bomData, projectData] = await Promise.all([
          bomService.getByCompany(user.companyId),
          projectService.getByCompany(user.companyId),
        ]);
      } else {
        [bomData, projectData] = await Promise.all([bomService.getAll(), projectService.getAll()]);
      }
      setItems(bomData);
      setProjects(projectData);
    } catch (error) {
      console.error('Failed to fetch BOM items', error);
      setErrorMessage(getErrorMessage(error, t('bom.fetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: Bom) => {
    if (item) {
      setEditingItem(item);
      setSelectedProject(findProjectSelection(item));
      setItemCode(item.itemCode);
      setItemName(item.itemName);
      setUnit(item.umBom);
      setQuantity(item.qntd.toString());
    } else {
      setEditingItem(null);
      setSelectedProject(null);
      setItemCode('');
      setItemName('');
      setUnit('');
      setQuantity('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!selectedProject) {
      setErrorMessage(t('bom.projectRequired'));
      return;
    }

    if (!itemCode || !itemName || !unit || !quantity) {
      setErrorMessage(t('bom.required'));
      return;
    }

    try {
      const user = userStorage.getUser();
      const bomData: Bom = {
        projectName: selectedProject.label,
        itemCode,
        itemName,
        umBom: unit,
        qntd: parseFloat(quantity),
        remainingQntd: parseFloat(quantity),
        project: { id: selectedProject.value },
        company: user && user.companyId ? { id: user.companyId } : undefined,
      };

      if (editingItem && editingItem.id) {
        Alert.alert(t('common.ok'), t('bom.updateNotImplemented'));
      } else {
        const created = await bomService.create(bomData);
        setItems((current) => [...current, created]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save BOM item', error);
      setErrorMessage(getErrorMessage(error, t('bom.createFailed')));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      t('bom.deleteTitle'),
      t('bom.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await bomService.delete(id);
              setItems((current) => current.filter((item) => item.id !== id));
            } catch (error) {
              console.error('Failed to delete', error);
              setErrorMessage(getErrorMessage(error, t('bom.deleteFailed')));
            }
          },
        },
      ]
    );
  };

  const renderItem = ({ item }: { item: Bom }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
        <Text style={styles.quantity}>{item.qntd} {item.umBom}</Text>
      </View>
      <Text style={styles.projectName}>{item.projectName || item.project?.name}</Text>
      <Text style={styles.itemName}>{item.itemName}</Text>

      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
          <Text style={styles.editText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => item.id && handleDelete(item.id)} style={styles.actionButton}>
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('bom.title')}
        subtitle={t('bom.subtitle')}
        right={<PillActionButton label={`+ ${t('bom.addItem')}`} onPress={() => handleOpenModal()} />}
        style={styles.header}
        titleStyle={{ fontSize: 24, marginBottom: 0 }}
      />

      {loading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[styles.listContent, items.length === 0 ? styles.emptyList : null]}
          refreshing={loading}
          onRefresh={fetchData}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('bom.empty')}</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ModalHeader
            title={editingItem ? t('bom.editItem') : t('bom.newItem')}
            onClose={() => setModalVisible(false)}
            closeLabel={t('common.close')}
          />
          <View style={styles.form}>
            <SelectField
              label={t('bom.project')}
              valueText={selectedProject?.label}
              placeholder={t('common.selectProject')}
              onPress={() => setSelectionModalVisible(true)}
            />
            <Input label={t('bom.itemCode')} value={itemCode} onChangeText={setItemCode} />
            <Input label={t('bom.itemName')} value={itemName} onChangeText={setItemName} />
            <Input label={t('bom.unit')} value={unit} onChangeText={setUnit} />
            <Input
              label={t('bom.quantity')}
              value={quantity}
              onChangeText={setQuantity}
              keyboardType="numeric"
            />

            <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
      </Modal>

      <Modal
        visible={selectionModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectionModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.selectionContent}>
            <ModalHeader title={t('report.modal.selectProject')} onClose={() => setSelectionModalVisible(false)} />
            <FlatList
              data={projectOptions}
              keyExtractor={(item) => item.value.toString()}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              renderItem={({ item }) => (
                <SelectableListItem
                  label={item.label}
                  selected={selectedProject?.value === item.value}
                  onPress={() => {
                    setSelectedProject(item);
                    setSelectionModalVisible(false);
                  }}
                />
              )}
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listContent: {
    padding: 15,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.textLight,
    fontSize: 16,
  },
  card: {
    marginBottom: 10,
    borderRadius: 10,
    padding: 15,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 2,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
  itemName: {
    fontSize: 14,
    color: theme.colors.textLight,
    marginTop: 4,
    marginBottom: 15,
  },
  projectName: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '600',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  actionButton: {
    marginLeft: 15,
  },
  editText: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  deleteText: {
    color: theme.colors.error,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  form: {
    padding: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  selectionContent: {
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

export default BOM;
