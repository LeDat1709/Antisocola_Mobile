import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, TextInput, Alert, ActivityIndicator, Switch
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spsoService, Campus, Building, Room } from '../../services/spsoService';

type TabType = 'campus' | 'building' | 'room';

export default function LocationsScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('campus');
  const [campuses, setCampuses] = useState<Campus[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal states
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [formData, setFormData] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadAllData();
  }, []);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadAllData = async () => {
    try {
      const [campusData, buildingData] = await Promise.all([
        spsoService.getCampuses(),
        spsoService.getBuildings(),
      ]);
      setCampuses(campusData);
      setBuildings(buildingData);
    } catch (error) {
      console.error(error);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'campus') {
        const data = await spsoService.getCampuses();
        setCampuses(data);
      } else if (activeTab === 'building') {
        const data = await spsoService.getBuildings();
        setBuildings(data);
      } else {
        const data = await spsoService.getRooms();
        setRooms(data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingItem(null);
    setFormData({ isActive: true });
    setShowModal(true);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    const typeName = activeTab === 'campus' ? 'Cơ sở' : activeTab === 'building' ? 'Tòa nhà' : 'Phòng';
    Alert.alert(
      'Xác nhận xóa',
      `Bạn có chắc muốn xóa ${typeName} này?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              if (activeTab === 'campus') await spsoService.deleteCampus(id);
              else if (activeTab === 'building') await spsoService.deleteBuilding(id);
              else await spsoService.deleteRoom(id);
              Alert.alert('Thành công', `Đã xóa ${typeName}`);
              loadData();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message || 'Không thể xóa');
            }
          },
        },
      ]
    );
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const isUpdate = !!editingItem;
      const typeName = activeTab === 'campus' ? 'Cơ sở' : activeTab === 'building' ? 'Tòa nhà' : 'Phòng';

      if (activeTab === 'campus') {
        if (isUpdate) await spsoService.updateCampus(editingItem.campusId, formData);
        else await spsoService.createCampus(formData);
      } else if (activeTab === 'building') {
        if (isUpdate) await spsoService.updateBuilding(editingItem.buildingId, formData);
        else await spsoService.createBuilding(formData);
      } else {
        if (isUpdate) await spsoService.updateRoom(editingItem.roomId, formData);
        else await spsoService.createRoom(formData);
      }

      Alert.alert('Thành công', `${isUpdate ? 'Cập nhật' : 'Thêm'} ${typeName} thành công`);
      setShowModal(false);
      loadData();
      loadAllData();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  const renderCampusList = () => (
    <>
      {campuses.map((item) => (
        <View key={item.campusId} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemCode}>{item.campusCode}</Text>
              <Text style={styles.itemName}>{item.campusName}</Text>
              {item.address && <Text style={styles.itemSub}>{item.address}</Text>}
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: item.isActive ? '#059669' : '#DC2626' }]}>
                {item.isActive ? 'HĐ' : 'KHĐ'}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.campusId)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  const renderBuildingList = () => (
    <>
      {buildings.map((item) => (
        <View key={item.buildingId} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemCode}>{item.buildingCode}</Text>
              <Text style={styles.itemName}>{item.buildingName || item.buildingCode}</Text>
              <Text style={styles.itemSub}>{item.campusName} • {item.floorCount || 0} tầng</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: item.isActive ? '#059669' : '#DC2626' }]}>
                {item.isActive ? 'HĐ' : 'KHĐ'}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.buildingId)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  const renderRoomList = () => (
    <>
      {rooms.map((item) => (
        <View key={item.roomId} style={styles.itemCard}>
          <View style={styles.itemHeader}>
            <View>
              <Text style={styles.itemCode}>{item.roomNumber}</Text>
              <Text style={styles.itemName}>{item.roomName || item.roomNumber}</Text>
              <Text style={styles.itemSub}>{item.buildingName} • {item.roomType || 'Phòng'}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: item.isActive ? '#D1FAE5' : '#FEE2E2' }]}>
              <Text style={[styles.statusText, { color: item.isActive ? '#059669' : '#DC2626' }]}>
                {item.isActive ? 'HĐ' : 'KHĐ'}
              </Text>
            </View>
          </View>
          <View style={styles.itemActions}>
            <TouchableOpacity style={styles.editBtn} onPress={() => handleEdit(item)}>
              <Ionicons name="create-outline" size={18} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item.roomId)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </>
  );

  const renderForm = () => {
    if (activeTab === 'campus') {
      return (
        <>
          <Text style={styles.inputLabel}>Mã cơ sở *</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="VD: CS1, CS2"
            value={formData.campusCode || ''}
            onChangeText={(v) => setFormData({ ...formData, campusCode: v })}
          />
          <Text style={styles.inputLabel}>Tên cơ sở *</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="VD: Cơ sở Thủ Đức"
            value={formData.campusName || ''}
            onChangeText={(v) => setFormData({ ...formData, campusName: v })}
          />
          <Text style={styles.inputLabel}>Địa chỉ</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="Nhập địa chỉ"
            value={formData.address || ''}
            onChangeText={(v) => setFormData({ ...formData, address: v })}
          />
        </>
      );
    }

    if (activeTab === 'building') {
      return (
        <>
          <Text style={styles.inputLabel}>Cơ sở *</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
            {campuses.map((c) => (
              <TouchableOpacity
                key={c.campusId}
                style={[styles.selectItem, formData.campusId === c.campusId && styles.selectItemActive]}
                onPress={() => setFormData({ ...formData, campusId: c.campusId })}
              >
                <Text style={[styles.selectText, formData.campusId === c.campusId && styles.selectTextActive]}>
                  {c.campusName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          <Text style={styles.inputLabel}>Mã tòa nhà *</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="VD: H1, A, B"
            value={formData.buildingCode || ''}
            onChangeText={(v) => setFormData({ ...formData, buildingCode: v })}
          />
          <Text style={styles.inputLabel}>Tên tòa nhà</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="VD: Tòa H1"
            value={formData.buildingName || ''}
            onChangeText={(v) => setFormData({ ...formData, buildingName: v })}
          />
          <Text style={styles.inputLabel}>Số tầng</Text>
          <TextInput
            style={styles.modalInput}
            placeholder="VD: 5"
            keyboardType="numeric"
            value={formData.floorCount?.toString() || ''}
            onChangeText={(v) => setFormData({ ...formData, floorCount: parseInt(v) || 0 })}
          />
        </>
      );
    }

    return (
      <>
        <Text style={styles.inputLabel}>Tòa nhà *</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.selectRow}>
          {buildings.map((b) => (
            <TouchableOpacity
              key={b.buildingId}
              style={[styles.selectItem, formData.buildingId === b.buildingId && styles.selectItemActive]}
              onPress={() => setFormData({ ...formData, buildingId: b.buildingId })}
            >
              <Text style={[styles.selectText, formData.buildingId === b.buildingId && styles.selectTextActive]}>
                {b.buildingName || b.buildingCode}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <Text style={styles.inputLabel}>Số phòng *</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="VD: 101, A201"
          value={formData.roomNumber || ''}
          onChangeText={(v) => setFormData({ ...formData, roomNumber: v })}
        />
        <Text style={styles.inputLabel}>Tên phòng</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="VD: Phòng máy 1"
          value={formData.roomName || ''}
          onChangeText={(v) => setFormData({ ...formData, roomName: v })}
        />
        <Text style={styles.inputLabel}>Loại phòng</Text>
        <TextInput
          style={styles.modalInput}
          placeholder="VD: Phòng học, Phòng máy"
          value={formData.roomType || ''}
          onChangeText={(v) => setFormData({ ...formData, roomType: v })}
        />
      </>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý vị trí</Text>
        <TouchableOpacity onPress={handleAdd} style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {(['campus', 'building', 'room'] as TabType[]).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>
              {tab === 'campus' ? 'Cơ sở' : tab === 'building' ? 'Tòa nhà' : 'Phòng'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {activeTab === 'campus' && renderCampusList()}
          {activeTab === 'building' && renderBuildingList()}
          {activeTab === 'room' && renderRoomList()}
        </ScrollView>
      )}

      {/* Form Modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {editingItem ? 'Chỉnh sửa' : 'Thêm mới'}{' '}
                {activeTab === 'campus' ? 'Cơ sở' : activeTab === 'building' ? 'Tòa nhà' : 'Phòng'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {renderForm()}
              <View style={styles.switchRow}>
                <Text style={styles.inputLabel}>Hoạt động</Text>
                <Switch
                  value={formData.isActive !== false}
                  onValueChange={(v) => setFormData({ ...formData, isActive: v })}
                  trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
                  thumbColor={formData.isActive ? '#7C3AED' : '#9CA3AF'}
                />
              </View>
              <TouchableOpacity
                style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  addBtn: { padding: 4 },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#7C3AED', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  itemCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  itemCode: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  itemName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 2 },
  itemSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600' },
  itemActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  editBtn: { padding: 8, backgroundColor: '#EFF6FF', borderRadius: 8 },
  deleteBtn: { padding: 8, backgroundColor: '#FEF2F2', borderRadius: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '85%' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 12 },
  modalInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  selectRow: { flexDirection: 'row', marginBottom: 8 },
  selectItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    marginRight: 8,
  },
  selectItemActive: { backgroundColor: '#7C3AED' },
  selectText: { fontSize: 13, color: '#374151' },
  selectTextActive: { color: '#fff', fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  submitBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 20,
  },
  submitBtnDisabled: { backgroundColor: '#A78BFA' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
