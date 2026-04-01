import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Modal, 
  Alert,
  ActivityIndicator,
  SafeAreaView
} from 'react-native';
import { theme } from '../styles/theme';
import { conversionService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Conversion } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import Card from '../components/Card';
import ModalHeader from '../components/ModalHeader';
import PillActionButton from '../components/PillActionButton';
import ScreenHeader from '../components/ScreenHeader';

const Conversions = () => {
  const [items, setItems] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Conversion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [itemCode, setItemCode] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [toUnit, setToUnit] = useState('');
  const [factor, setFactor] = useState('');
  const [category, setCategory] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let data: Conversion[] = [];
      if (user && user.companyId) {
        data = await conversionService.getByCompany(user.companyId);
      } else {
        data = await conversionService.getAll();
      }
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch conversions', error);
      setErrorMessage(getErrorMessage(error, 'Failed to fetch conversions'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item?: Conversion) => {
    if (item) {
      setEditingItem(item);
      setItemCode(item.itemCode);
      setFromUnit(item.umInvoice);
      setToUnit(item.umBom);
      setFactor(item.conversionFactor.toString());
      setCategory(item.category || '');
    } else {
      setEditingItem(null);
      setItemCode('');
      setFromUnit('');
      setToUnit('');
      setFactor('');
      setCategory('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!itemCode || !fromUnit || !toUnit || !factor) {
      setErrorMessage('Please fill all required fields');
      return;
    }

    try {
      const user = userStorage.getUser();
      const conversionData: Conversion = {
        itemCode,
        umInvoice: fromUnit,
        umBom: toUnit,
        conversionFactor: parseFloat(factor),
        category: category || 'General',
        company: user && user.companyId ? { id: user.companyId } : undefined
      };

      if (editingItem && editingItem.id) {
        // Edit logic (API doesn't have update yet based on service, but let's assume or just skip)
        // For now, let's just alert
        Alert.alert('Info', 'Update feature not implemented in mobile yet');
      } else {
        // Create
        const created = await conversionService.create(conversionData);
        setItems([...items, created]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save conversion', error);
      setErrorMessage(getErrorMessage(error, 'Failed to save conversion'));
    }
  };

  const handleDelete = async (id: number) => {
    Alert.alert(
      'Delete',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            try {
              await conversionService.delete(id);
              setItems(items.filter(i => i.id !== id));
            } catch (error) {
              console.error('Failed to delete', error);
              setErrorMessage(getErrorMessage(error, 'Failed to delete item'));
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: Conversion }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
        <Text style={styles.category}>{item.category}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.conversionText}>
          {item.umInvoice} ➔ {item.umBom}
        </Text>
        <Text style={styles.factor}>x{item.conversionFactor}</Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => item.id && handleDelete(item.id)} style={styles.actionButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title="Conversions"
        right={<PillActionButton label="+ Add" onPress={() => handleOpenModal()} />}
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
          contentContainerStyle={styles.listContent}
          refreshing={loading}
          onRefresh={fetchItems}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ModalHeader title={editingItem ? 'Edit Conversion' : 'New Conversion'} onClose={() => setModalVisible(false)} closeLabel="Close" />
          <View style={styles.form}>
            <Input label="Item Code" value={itemCode} onChangeText={setItemCode} />
            <Input label="From Unit (Invoice)" value={fromUnit} onChangeText={setFromUnit} />
            <Input label="To Unit (BOM)" value={toUnit} onChangeText={setToUnit} />
            <Input label="Factor" value={factor} onChangeText={setFactor} keyboardType="numeric" />
            <Input label="Category" value={category} onChangeText={setCategory} />
            
            <Button title="Save" onPress={handleSave} style={{ marginTop: 20 }} />
          </View>
        </SafeAreaView>
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
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  listContent: {
    padding: 15,
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
    marginBottom: 10,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  category: {
    fontSize: 12,
    color: theme.colors.textLight,
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    overflow: 'hidden',
  },
  cardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  conversionText: {
    fontSize: 14,
    color: theme.colors.text,
  },
  factor: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.primary,
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

export default Conversions;
