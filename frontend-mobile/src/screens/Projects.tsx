import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Card from '../components/Card';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import Input from '../components/Input';
import ModalHeader from '../components/ModalHeader';
import PillActionButton from '../components/PillActionButton';
import ScreenHeader from '../components/ScreenHeader';
import { useI18n } from '../i18n/i18n';
import { projectService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { theme } from '../styles/theme';
import { Project } from '../types';

const normalizeProjectName = (name: string) => name.trim().toLowerCase();

const Projects = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Project | null>(null);
  const [projectName, setProjectName] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      const data =
        user && user.companyId
          ? await projectService.getByCompany(user.companyId)
          : await projectService.getAll();
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch projects', error);
      setErrorMessage(getErrorMessage(error, t('projects.fetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item?: Project) => {
    if (item) {
      setEditingItem(item);
      setProjectName(item.name);
    } else {
      setEditingItem(null);
      setProjectName('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    const trimmedName = projectName.trim();

    if (!trimmedName) {
      setErrorMessage(t('projects.required'));
      return;
    }

    const duplicate = items.some(
      (item) =>
        normalizeProjectName(item.name) === normalizeProjectName(trimmedName) &&
        item.id !== editingItem?.id
    );
    if (duplicate) {
      setErrorMessage(t('projects.duplicate'));
      return;
    }

    try {
      const user = userStorage.getUser();
      const payload: Project = {
        name: trimmedName,
        company: user && user.companyId ? { id: user.companyId } : editingItem?.company,
      };

      if (editingItem?.id) {
        const updated = await projectService.update(editingItem.id, payload);
        setItems((current) => current.map((item) => (item.id === editingItem.id ? updated : item)));
      } else {
        const created = await projectService.create(payload);
        setItems((current) => [...current, created]);
      }

      setModalVisible(false);
      setProjectName('');
      setEditingItem(null);
    } catch (error) {
      console.error('Failed to save project', error);
      setErrorMessage(getErrorMessage(error, t('projects.createFailed')));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(t('projects.deleteTitle'), t('projects.deleteConfirm'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('common.delete'),
        style: 'destructive',
        onPress: async () => {
          try {
            await projectService.delete(id);
            setItems((current) => current.filter((item) => item.id !== id));
          } catch (error) {
            console.error('Failed to delete project', error);
            setErrorMessage(getErrorMessage(error, t('projects.deleteFailed')));
          }
        },
      },
    ]);
  };

  const renderItem = ({ item }: { item: Project }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.projectName}>{item.name}</Text>
      </View>

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
        title={t('projects.title')}
        subtitle={t('projects.subtitle')}
        right={<PillActionButton label={`+ ${t('projects.addProject')}`} onPress={() => handleOpenModal()} />}
        style={styles.header}
        titleStyle={{ fontSize: 24, marginBottom: 0 }}
      />

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={styles.loading} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || item.name}
          contentContainerStyle={[styles.listContent, items.length === 0 ? styles.emptyList : null]}
          refreshing={loading}
          onRefresh={fetchItems}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('projects.empty')}</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ModalHeader
            title={editingItem ? t('projects.editProject') : t('projects.newProject')}
            onClose={() => setModalVisible(false)}
            closeLabel={t('common.close')}
          />
          <View style={styles.form}>
            <Input label={t('projects.name')} value={projectName} onChangeText={setProjectName} />
            <Button title={t('common.save')} onPress={handleSave} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
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
  loading: {
    marginTop: 20,
  },
  loadingState: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textLight,
    fontSize: 14,
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
    marginBottom: 10,
  },
  projectName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
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
});

export default Projects;
