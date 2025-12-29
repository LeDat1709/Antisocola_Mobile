import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput,
  Switch, Modal, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spsoService, SystemSettings, Semester } from '../../services/spsoService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'general' | 'semesters'>('general');

  // Form data
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fileTypes, setFileTypes] = useState<string[]>([]);

  // Semester modal
  const [showSemesterModal, setShowSemesterModal] = useState(false);
  const [editingSemester, setEditingSemester] = useState<Semester | null>(null);
  const [semesterForm, setSemesterForm] = useState<any>({});

  const availableFileTypes = ['pdf', 'doc', 'docx', 'ppt', 'pptx', 'xls', 'xlsx', 'txt'];

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const data = await spsoService.getSettings();
      setSettings(data);

      // Parse configs
      const configs: Record<string, string> = {};
      Object.entries(data.configs).forEach(([key, config]) => {
        configs[key] = config.configValue;
      });
      setFormData(configs);

      // Parse file types
      const extensions = configs.allowed_file_extensions?.split(',') || [];
      setFileTypes(extensions);
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải cấu hình');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveConfigs = async () => {
    try {
      setSaving(true);
      const updatedData = {
        ...formData,
        allowed_file_extensions: fileTypes.join(','),
      };
      await spsoService.updateMultipleConfigs(updatedData);
      Alert.alert('Thành công', 'Đã lưu cấu hình');
      loadSettings();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu cấu hình');
    } finally {
      setSaving(false);
    }
  };

  const toggleFileType = (ext: string) => {
    setFileTypes((prev) =>
      prev.includes(ext) ? prev.filter((e) => e !== ext) : [...prev, ext]
    );
  };

  const handleAddSemester = () => {
    setEditingSemester(null);
    setSemesterForm({
      semesterCode: '',
      semesterName: '',
      academicYear: '',
      startDate: '',
      endDate: '',
      defaultA4Pages: 100,
    });
    setShowSemesterModal(true);
  };

  const handleEditSemester = (semester: Semester) => {
    setEditingSemester(semester);
    setSemesterForm({
      semesterCode: semester.semesterCode,
      semesterName: semester.semesterName,
      academicYear: semester.academicYear,
      startDate: semester.startDate,
      endDate: semester.endDate,
      defaultA4Pages: semester.defaultA4Pages,
    });
    setShowSemesterModal(true);
  };

  const handleDeleteSemester = (semester: Semester) => {
    if (semester.isCurrent) {
      Alert.alert('Thông báo', 'Không thể xóa học kỳ hiện tại');
      return;
    }
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa học kỳ này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await spsoService.deleteSemester(semester.semesterId);
            Alert.alert('Thành công', 'Đã xóa học kỳ');
            loadSettings();
          } catch (error: any) {
            Alert.alert('Lỗi', error.message || 'Không thể xóa');
          }
        },
      },
    ]);
  };

  const handleSaveSemester = async () => {
    try {
      setSaving(true);
      if (editingSemester) {
        await spsoService.updateSemester({
          semesterId: editingSemester.semesterId,
          ...semesterForm,
        });
      } else {
        await spsoService.createSemester(semesterForm);
      }
      Alert.alert('Thành công', editingSemester ? 'Đã cập nhật học kỳ' : 'Đã thêm học kỳ');
      setShowSemesterModal(false);
      loadSettings();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể lưu');
    } finally {
      setSaving(false);
    }
  };

  const getSemesterStatus = (semester: Semester) => {
    const today = new Date();
    const start = new Date(semester.startDate);
    const end = new Date(semester.endDate);

    if (!semester.isActive) return { label: 'Đã xóa', color: '#6B7280', bg: '#F3F4F6' };
    if (today < start) return { label: 'Sắp tới', color: '#3B82F6', bg: '#DBEAFE' };
    if (today >= start && today <= end) return { label: 'Đang diễn ra', color: '#059669', bg: '#D1FAE5' };
    return { label: 'Đã kết thúc', color: '#6B7280', bg: '#F3F4F6' };
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Cài đặt hệ thống</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Cài đặt hệ thống</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'general' && styles.tabActive]}
          onPress={() => setActiveTab('general')}
        >
          <Text style={[styles.tabText, activeTab === 'general' && styles.tabTextActive]}>Cấu hình chung</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'semesters' && styles.tabActive]}
          onPress={() => setActiveTab('semesters')}
        >
          <Text style={[styles.tabText, activeTab === 'semesters' && styles.tabTextActive]}>Học kỳ</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'general' ? (
        <ScrollView style={styles.content}>
          {/* Student Config */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text style={styles.sectionTitle}>Cấu hình sinh viên</Text>
            </View>
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Số trang A4 mặc định/học kỳ</Text>
                <TextInput
                  style={styles.configInput}
                  keyboardType="numeric"
                  value={formData.default_a4_pages_per_semester || ''}
                  onChangeText={(v) => setFormData({ ...formData, default_a4_pages_per_semester: v })}
                />
              </View>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Giá mỗi trang A4 (VND)</Text>
                <TextInput
                  style={styles.configInput}
                  keyboardType="numeric"
                  value={formData.a4_price_per_page || ''}
                  onChangeText={(v) => setFormData({ ...formData, a4_price_per_page: v })}
                />
              </View>
              <View style={styles.switchItem}>
                <Text style={styles.configLabel}>Tự động cấp trang đầu học kỳ</Text>
                <Switch
                  value={formData.auto_allocate_pages === 'true'}
                  onValueChange={(v) => setFormData({ ...formData, auto_allocate_pages: v ? 'true' : 'false' })}
                  trackColor={{ false: '#D1D5DB', true: '#A78BFA' }}
                  thumbColor={formData.auto_allocate_pages === 'true' ? '#7C3AED' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          {/* File Config */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="document" size={20} color="#10B981" />
              <Text style={styles.sectionTitle}>Cấu hình file</Text>
            </View>
            <View style={styles.configCard}>
              <View style={styles.configItem}>
                <Text style={styles.configLabel}>Kích thước file tối đa (MB)</Text>
                <TextInput
                  style={styles.configInput}
                  keyboardType="numeric"
                  value={formData.max_file_size_mb || ''}
                  onChangeText={(v) => setFormData({ ...formData, max_file_size_mb: v })}
                />
              </View>
              <Text style={styles.configLabel}>Định dạng file cho phép</Text>
              <View style={styles.fileTypesGrid}>
                {availableFileTypes.map((ext) => (
                  <TouchableOpacity
                    key={ext}
                    style={[styles.fileTypeItem, fileTypes.includes(ext) && styles.fileTypeItemActive]}
                    onPress={() => toggleFileType(ext)}
                  >
                    <Text style={[styles.fileTypeText, fileTypes.includes(ext) && styles.fileTypeTextActive]}>
                      .{ext}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          {/* System Config */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons name="settings" size={20} color="#8B5CF6" />
              <Text style={styles.sectionTitle}>Cấu hình hệ thống</Text>
            </View>
            <View style={styles.configCard}>
              <View style={styles.switchItem}>
                <View>
                  <Text style={styles.configLabel}>Chế độ bảo trì</Text>
                  <Text style={styles.configHint}>Khi bật, sinh viên không thể sử dụng hệ thống</Text>
                </View>
                <Switch
                  value={formData.system_maintenance_mode === 'true'}
                  onValueChange={(v) => setFormData({ ...formData, system_maintenance_mode: v ? 'true' : 'false' })}
                  trackColor={{ false: '#D1D5DB', true: '#FCA5A5' }}
                  thumbColor={formData.system_maintenance_mode === 'true' ? '#EF4444' : '#9CA3AF'}
                />
              </View>
            </View>
          </View>

          {/* Save Button */}
          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleSaveConfigs}
            disabled={saving}
          >
            <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu cấu hình'}</Text>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <ScrollView style={styles.content}>
          {/* Current Semester */}
          {settings?.currentSemester && (
            <View style={styles.currentSemesterCard}>
              <View style={styles.currentSemesterHeader}>
                <Ionicons name="calendar" size={24} color="#fff" />
                <Text style={styles.currentSemesterLabel}>Học kỳ hiện tại</Text>
              </View>
              <Text style={styles.currentSemesterName}>{settings.currentSemester.semesterName}</Text>
              <Text style={styles.currentSemesterDate}>
                {settings.currentSemester.startDate} - {settings.currentSemester.endDate}
              </Text>
            </View>
          )}

          {/* Add Button */}
          <TouchableOpacity style={styles.addSemesterBtn} onPress={handleAddSemester}>
            <Ionicons name="add" size={20} color="#7C3AED" />
            <Text style={styles.addSemesterText}>Thêm học kỳ mới</Text>
          </TouchableOpacity>

          {/* Semesters List */}
          {settings?.semesters.map((semester) => {
            const status = getSemesterStatus(semester);
            return (
              <View key={semester.semesterId} style={styles.semesterCard}>
                <View style={styles.semesterHeader}>
                  <View>
                    <Text style={styles.semesterCode}>{semester.semesterCode}</Text>
                    <Text style={styles.semesterName}>{semester.semesterName}</Text>
                    <Text style={styles.semesterDate}>
                      {semester.startDate} - {semester.endDate}
                    </Text>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: status.bg }]}>
                    <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
                  </View>
                </View>
                <View style={styles.semesterActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => handleEditSemester(semester)}>
                    <Ionicons name="create-outline" size={18} color="#3B82F6" />
                  </TouchableOpacity>
                  {!semester.isCurrent && (
                    <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSemester(semester)}>
                      <Ionicons name="trash-outline" size={18} color="#EF4444" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Semester Modal */}
      <Modal visible={showSemesterModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingSemester ? 'Sửa học kỳ' : 'Thêm học kỳ'}</Text>
              <TouchableOpacity onPress={() => setShowSemesterModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              <Text style={styles.inputLabel}>Mã học kỳ *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: HK1-2024"
                value={semesterForm.semesterCode || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, semesterCode: v })}
              />
              <Text style={styles.inputLabel}>Tên học kỳ *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: Học kỳ 1"
                value={semesterForm.semesterName || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, semesterName: v })}
              />
              <Text style={styles.inputLabel}>Năm học *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: 2024-2025"
                value={semesterForm.academicYear || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, academicYear: v })}
              />
              <Text style={styles.inputLabel}>Ngày bắt đầu * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: 2024-09-01"
                value={semesterForm.startDate || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, startDate: v })}
              />
              <Text style={styles.inputLabel}>Ngày kết thúc * (YYYY-MM-DD)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="VD: 2025-01-15"
                value={semesterForm.endDate || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, endDate: v })}
              />
              <Text style={styles.inputLabel}>Số trang A4 mặc định</Text>
              <TextInput
                style={styles.modalInput}
                keyboardType="numeric"
                value={semesterForm.defaultA4Pages?.toString() || ''}
                onChangeText={(v) => setSemesterForm({ ...semesterForm, defaultA4Pages: parseInt(v) || 0 })}
              />
              <TouchableOpacity
                style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                onPress={handleSaveSemester}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tabs: { flexDirection: 'row', backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tab: { flex: 1, paddingVertical: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#7C3AED', fontWeight: '600' },
  content: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  configCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  configItem: { marginBottom: 16 },
  configLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  configHint: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  configInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  switchItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 8 },
  fileTypesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  fileTypeItem: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#F3F4F6',
  },
  fileTypeItemActive: { backgroundColor: '#EDE9FE', borderColor: '#7C3AED' },
  fileTypeText: { fontSize: 13, color: '#374151' },
  fileTypeTextActive: { color: '#7C3AED', fontWeight: '600' },
  saveBtn: {
    backgroundColor: '#7C3AED',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 30,
  },
  saveBtnDisabled: { backgroundColor: '#A78BFA' },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  currentSemesterCard: { backgroundColor: '#7C3AED', borderRadius: 16, padding: 20, marginBottom: 16 },
  currentSemesterHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  currentSemesterLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  currentSemesterName: { fontSize: 22, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  currentSemesterDate: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  addSemesterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EDE9FE',
    borderRadius: 10,
    paddingVertical: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderStyle: 'dashed',
  },
  addSemesterText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  semesterCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  semesterHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  semesterCode: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  semesterName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 2 },
  semesterDate: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  statusText: { fontSize: 11, fontWeight: '600' },
  semesterActions: {
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
