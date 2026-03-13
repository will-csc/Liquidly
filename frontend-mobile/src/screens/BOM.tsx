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
import { bomService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Bom } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';

const BOM = () => {
  const [items, setItems] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Bom | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Form State
  const [itemCode, setItemCode] = useState('');
  const [itemName, setItemName] = useState('');
  const [unit, setUnit] = useState('');
  const [quantity, setQuantity] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let data: Bom[] = [];
      if (user && user.companyId) {
        data = await bomService.getByCompany(user.companyId);
      } else {
        data = await bomService.getAll();
      }
      setItems(data);
    } catch (error) {
      console.error('Failed to fetch BOM items', error);
      setErrorMessage(getErrorMessage(error, 'Failed to fetch BOM items'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleOpenModal = (item?: Bom) => {
    if (item) {
      setEditingItem(item);
      setItemCode(item.itemCode);
      setItemName(item.itemName);
      setUnit(item.umBom);
      setQuantity(item.qntd.toString());
    } else {
      setEditingItem(null);
      setItemCode('');
      setItemName('');
      setUnit('');
      setQuantity('');
    }
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!itemCode || !itemName || !unit || !quantity) {
      setErrorMessage('Please fill all required fields');
      return;
    }

    try {
      const user = userStorage.getUser();
      const bomData: Bom = {
        itemCode,
        itemName,
        umBom: unit,
        qntd: parseFloat(quantity),
        company: user && user.companyId ? { id: user.companyId } : undefined
      };

      if (editingItem && editingItem.id) {
        // Edit logic
        Alert.alert('Info', 'Update feature not implemented in mobile yet');
      } else {
        // Create
        const created = await bomService.create(bomData);
        setItems([...items, created]);
      }
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save BOM item', error);
      setErrorMessage(getErrorMessage(error, 'Failed to save BOM item'));
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
              await bomService.delete(id);
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

  const renderItem = ({ item }: { item: Bom }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
        <Text style={styles.quantity}>{item.qntd} {item.umBom}</Text>
      </View>
      <Text style={styles.itemName}>{item.itemName}</Text>
      
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={styles.actionButton}>
          <Text style={styles.editText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => item.id && handleDelete(item.id)} style={styles.actionButton}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Bill of Materials</Text>
        <TouchableOpacity onPress={() => handleOpenModal()} style={styles.addButton}>
          <Text style={styles.addButtonText}>+ Add</Text>
        </TouchableOpacity>
      </View>

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
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{editingItem ? 'Edit Item' : 'New Item'}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.form}>
            <Input label="Item Code" value={itemCode} onChangeText={setItemCode} />
            <Input label="Item Name" value={itemName} onChangeText={setItemName} />
            <Input label="Unit" value={unit} onChangeText={setUnit} />
            <Input label="Quantity" value={quantity} onChangeText={setQuantity} keyboardType="numeric" />
            
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  addButton: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  listContent: {
    padding: 15,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
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
    marginBottom: 15,
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
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeText: {
    color: theme.colors.primary,
    fontSize: 16,
  },
  form: {
    padding: 20,
  },
});

export default BOM;
