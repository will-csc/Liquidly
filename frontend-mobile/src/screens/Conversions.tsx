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
import { useI18n } from '../i18n/i18n';
import { theme } from '../styles/theme';
import { bomService, conversionService } from '../services/api';
import { userStorage } from '../services/userStorage';
import { Bom, Conversion } from '../types';
import Input from '../components/Input';
import Button from '../components/Button';
import ErrorOverlay, { getErrorMessage } from '../components/ErrorOverlay';
import Card from '../components/Card';
import ModalHeader from '../components/ModalHeader';
import PillActionButton from '../components/PillActionButton';
import ScreenHeader from '../components/ScreenHeader';
import SelectField from '../components/SelectField';
import SelectableListItem from '../components/SelectableListItem';

const normalizeItemCode = (value: string) => value.trim().toLowerCase();

interface BomSelectionItem {
  label: string;
  value: string;
  unit: string;
}

const Conversions = () => {
  const { t } = useI18n();
  const [items, setItems] = useState<Conversion[]>([]);
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingItem, setEditingItem] = useState<Conversion | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [selectionModalVisible, setSelectionModalVisible] = useState(false);
  const [bomSearch, setBomSearch] = useState('');
  const [selectedBomOption, setSelectedBomOption] = useState<BomSelectionItem | null>(null);

  // Form State
  const [itemCode, setItemCode] = useState('');
  const [invoiceQuantity, setInvoiceQuantity] = useState('');
  const [fromUnit, setFromUnit] = useState('');
  const [bomQuantity, setBomQuantity] = useState('');
  const [toUnit, setToUnit] = useState('');

  const bomOptions = useMemo(() => {
    const uniqueOptions = new Map<string, BomSelectionItem>();

    boms.forEach((bom) => {
      const normalizedCode = normalizeItemCode(bom.itemCode);
      if (!normalizedCode || uniqueOptions.has(normalizedCode)) {
        return;
      }

      uniqueOptions.set(normalizedCode, {
        value: bom.itemCode,
        label: `${bom.itemCode} - ${bom.itemName}`,
        unit: bom.umBom,
      });
    });

    return Array.from(uniqueOptions.values()).sort((first, second) => first.label.localeCompare(second.label));
  }, [boms]);

  const filteredBomOptions = useMemo(() => {
    const search = normalizeItemCode(bomSearch);
    if (!search) {
      return bomOptions;
    }

    return bomOptions.filter(
      (option) =>
        normalizeItemCode(option.label).includes(search) ||
        normalizeItemCode(option.value).includes(search)
    );
  }, [bomOptions, bomSearch]);

  const findBomOption = (code: string) => {
    const normalizedCode = normalizeItemCode(code);
    return bomOptions.find((option) => normalizeItemCode(option.value) === normalizedCode) || null;
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const user = userStorage.getUser();
      let data: Conversion[] = [];
      let bomData: Bom[] = [];
      if (user && user.companyId) {
        [data, bomData] = await Promise.all([
          conversionService.getByCompany(user.companyId),
          bomService.getByCompany(user.companyId),
        ]);
      } else {
        [data, bomData] = await Promise.all([conversionService.getAll(), bomService.getAll()]);
      }
      setItems(data);
      setBoms(bomData);
    } catch (error) {
      console.error('Failed to fetch conversions', error);
      setErrorMessage(getErrorMessage(error, t('conversions.fetchFailed')));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenModal = (item?: Conversion) => {
    if (item) {
      const matchedBomOption = findBomOption(item.itemCode);
      setEditingItem(item);
      setItemCode(item.itemCode);
      setInvoiceQuantity(item.qntdInvoice?.toString() || '');
      setFromUnit(item.umInvoice);
      setBomQuantity(item.qntdBom?.toString() || '');
      setToUnit(item.umBom);
      setSelectedBomOption(
        matchedBomOption || {
          value: item.itemCode,
          label: item.itemCode,
          unit: item.umBom,
        }
      );
    } else {
      setEditingItem(null);
      setItemCode('');
      setInvoiceQuantity('');
      setFromUnit('');
      setBomQuantity('');
      setToUnit('');
      setSelectedBomOption(null);
    }
    setBomSearch('');
    setModalVisible(true);
  };

  const handleSelectBom = (option: BomSelectionItem) => {
    setSelectedBomOption(option);
    setItemCode(option.value);
    setToUnit(option.unit);
    setSelectionModalVisible(false);
  };

  const handleSave = async () => {
    if (!itemCode || !invoiceQuantity || !fromUnit || !bomQuantity) {
      setErrorMessage(t('conversions.required'));
      return;
    }

    const bomOption = findBomOption(itemCode);
    if (!bomOption) {
      setErrorMessage(t('conversions.itemNotInBom'));
      return;
    }

    try {
      const user = userStorage.getUser();
      const conversionData: Conversion = {
        itemCode: bomOption.value,
        qntdInvoice: parseFloat(invoiceQuantity),
        umInvoice: fromUnit,
        qntdBom: parseFloat(bomQuantity),
        umBom: bomOption.unit,
        company: user && user.companyId ? { id: user.companyId } : undefined,
      };

      if (editingItem && editingItem.id) {
        await conversionService.update(editingItem.id, conversionData);
      } else {
        await conversionService.create(conversionData);
      }
      await fetchData();
      setModalVisible(false);
    } catch (error) {
      console.error('Failed to save conversion', error);
      setErrorMessage(getErrorMessage(error, t('conversions.createFailed')));
    }
  };

  const handleDelete = async (item: Conversion) => {
    if (typeof item.id !== 'number') {
      setErrorMessage(t('conversions.deleteFailed'));
      await fetchData();
      return;
    }

    Alert.alert(
      t('conversions.deleteTitle'),
      t('conversions.deleteConfirm'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await conversionService.delete(item.id);
              await fetchData();
            } catch (error) {
              console.error('Failed to delete', error);
              setErrorMessage(getErrorMessage(error, t('conversions.deleteFailed')));
            }
          },
        },
      ]
    );
  };

  const getFactor = (item: Conversion) => {
    const qntdInvoice = item.qntdInvoice ?? 0;
    const qntdBom = item.qntdBom ?? 0;
    if (qntdInvoice === 0) return '0';
    const value = item.conversionFactor ?? qntdBom / qntdInvoice;
    return Number.isFinite(value) ? value.toString() : '0';
  };

  const renderItem = ({ item }: { item: Conversion }) => (
    <Card style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.itemCode}>{item.itemCode}</Text>
        <Text style={styles.factor}>x{getFactor(item)}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.conversionText}>
          {(item.qntdInvoice ?? 0).toString()} {item.umInvoice} {'->'} {(item.qntdBom ?? 0).toString()} {item.umBom}
        </Text>
      </View>
      <View style={styles.cardActions}>
        <TouchableOpacity onPress={() => handleOpenModal(item)} style={[styles.actionButton, styles.editActionButton]}>
          <Text style={styles.editText}>{t('common.edit')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => handleDelete(item)} style={[styles.actionButton, styles.deleteActionButton]}>
          <Text style={styles.deleteText}>{t('common.delete')}</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        title={t('conversions.title')}
        subtitle={t('conversions.subtitle')}
        right={<PillActionButton label={`+ ${t('conversions.addConversion')}`} onPress={() => handleOpenModal()} />}
        style={styles.header}
        titleStyle={{ fontSize: 24, marginBottom: 0 }}
      />

      {loading ? (
        <View style={styles.loadingState}>
          <ActivityIndicator size="large" color={theme.colors.primary} style={{ marginTop: 20 }} />
          <Text style={styles.loadingText}>{t('common.loading')}</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id?.toString() || Math.random().toString()}
          contentContainerStyle={[styles.listContent, items.length === 0 ? styles.emptyList : null]}
          refreshing={loading}
          onRefresh={fetchData}
          ListEmptyComponent={<Text style={styles.emptyText}>{t('conversions.empty')}</Text>}
        />
      )}

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView style={styles.modalContainer}>
          <ModalHeader
            title={editingItem ? t('conversions.editConversion') : t('conversions.newConversion')}
            onClose={() => setModalVisible(false)}
            closeLabel={t('common.close')}
          />
          <View style={styles.form}>
            <SelectField
              label={t('conversions.itemCode')}
              valueText={selectedBomOption?.label || itemCode || undefined}
              placeholder={t('conversions.selectItem')}
              onPress={() => setSelectionModalVisible(true)}
            />
            <Input
              label={t('conversions.invoiceQuantity')}
              value={invoiceQuantity}
              onChangeText={setInvoiceQuantity}
              keyboardType="numeric"
            />
            <Input label={t('conversions.fromUnit')} value={fromUnit} onChangeText={setFromUnit} />
            <Input
              label={t('conversions.bomQuantity')}
              value={bomQuantity}
              onChangeText={setBomQuantity}
              keyboardType="numeric"
            />
            <Input label={t('conversions.toUnit')} value={toUnit} editable={false} />

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
            <ModalHeader title={t('conversions.selectItem')} onClose={() => setSelectionModalVisible(false)} />
            <View style={styles.searchContainer}>
              <Input
                label={t('common.search')}
                value={bomSearch}
                onChangeText={setBomSearch}
                placeholder={t('conversions.filterItems')}
              />
            </View>
            <FlatList
              data={filteredBomOptions}
              keyExtractor={(item) => item.value}
              contentContainerStyle={styles.modalList}
              ItemSeparatorComponent={() => <View style={styles.modalSeparator} />}
              ListEmptyComponent={<Text style={styles.emptyText}>{t('conversions.noBomItemsAvailable')}</Text>}
              renderItem={({ item }) => (
                <SelectableListItem
                  label={item.label}
                  selected={selectedBomOption?.value === item.value}
                  onPress={() => handleSelectBom(item)}
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
  loadingState: {
    marginTop: 20,
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    color: theme.colors.textLight,
    fontSize: 14,
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
    marginBottom: 10,
  },
  itemCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  cardBody: {
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
    minWidth: 88,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  editActionButton: {
    backgroundColor: '#edf7f0',
  },
  deleteActionButton: {
    backgroundColor: '#fdecec',
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
    maxHeight: '80%',
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 4,
  },
  modalList: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  modalSeparator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
});

export default Conversions;
