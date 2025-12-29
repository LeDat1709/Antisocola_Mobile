import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput,
  RefreshControl, Modal, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spsoService, Student, StudentDetail } from '../../services/spsoService';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [studentDetail, setStudentDetail] = useState<StudentDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [allocateA4, setAllocateA4] = useState('');
  const [allocateA3, setAllocateA3] = useState('');
  const [allocateReason, setAllocateReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadStudents = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (statusFilter) filters.status = statusFilter;
      filters.sortBy = 'studentId';
      filters.sortDirection = 'ASC';

      const data = await spsoService.getStudents(pageNum, 20, filters);
      setStudents(data.content);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, statusFilter]);

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSearch = () => {
    loadStudents(0);
  };

  const handleViewDetail = async (student: Student) => {
    setSelectedStudent(student);
    try {
      const detail = await spsoService.getStudentDetail(student.studentId);
      setStudentDetail(detail);
      setShowDetailModal(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết sinh viên');
    }
  };

  const handleAllocatePages = (student: Student) => {
    setSelectedStudent(student);
    setAllocateA4('');
    setAllocateA3('');
    setAllocateReason('');
    setShowAllocateModal(true);
  };

  const handleUpdateStatus = (student: Student) => {
    setSelectedStudent(student);
    setNewStatus(student.status === 'Active' ? 'Inactive' : 'Active');
    setStatusReason('');
    setShowStatusModal(true);
  };

  const submitAllocatePages = async () => {
    if (!selectedStudent) return;
    const a4 = parseInt(allocateA4) || 0;
    const a3 = parseInt(allocateA3) || 0;
    if (a4 <= 0 && a3 <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số trang cần cấp');
      return;
    }
    try {
      setSaving(true);
      await spsoService.allocatePagesToStudent(selectedStudent.studentId, a4, a3, allocateReason);
      Alert.alert('Thành công', `Đã cấp ${a4} trang A4${a3 > 0 ? ` và ${a3} trang A3` : ''} cho ${selectedStudent.fullName}`);
      setShowAllocateModal(false);
      loadStudents(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cấp trang');
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateStatus = async () => {
    if (!selectedStudent) return;
    try {
      setSaving(true);
      await spsoService.updateStudentStatus(selectedStudent.studentId, newStatus, statusReason);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái sinh viên');
      setShowStatusModal(false);
      loadStudents(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      Active: { bg: '#D1FAE5', text: '#059669' },
      Inactive: { bg: '#E5E7EB', text: '#6B7280' },
      Suspended: { bg: '#FEE2E2', text: '#DC2626' },
    };
    return styles[status] || { bg: '#E5E7EB', text: '#6B7280' };
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      Active: 'Hoạt động',
      Inactive: 'Không HĐ',
      Suspended: 'Bị khóa',
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const renderStudent = ({ item }: { item: Student }) => {
    const statusBadge = getStatusBadge(item.status);
    return (
      <View style={styles.studentCard}>
        <View style={styles.studentHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.studentInfo}>
            <Text style={styles.studentId}>{item.studentId}</Text>
            <Text style={styles.studentName}>{item.fullName}</Text>
            <Text style={styles.studentEmail}>{item.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
            <Text style={[styles.statusText, { color: statusBadge.text }]}>{getStatusLabel(item.status)}</Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Số dư A4</Text>
            <Text style={styles.balanceValue}>{item.a4Balance}</Text>
          </View>
          {item.a3Balance > 0 && (
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Số dư A3</Text>
              <Text style={styles.balanceValue}>{item.a3Balance}</Text>
            </View>
          )}
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Số lần in</Text>
            <Text style={styles.balanceValue}>{item.totalPrintJobs}</Text>
          </View>
        </View>

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetail(item)}>
            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Chi tiết</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleAllocatePages(item)}>
            <Ionicons name="add-circle-outline" size={18} color="#10B981" />
            <Text style={[styles.actionText, { color: '#10B981' }]}>Cấp trang</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item)}>
            <Ionicons name="toggle-outline" size={18} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Trạng thái</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý sinh viên</Text>
        <Text style={styles.subtitle}>Quản lý thông tin, số dư trang và trạng thái</Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Tìm theo MSSV, email, tên..."
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Status Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { value: '', label: 'Tất cả' },
            { value: 'Active', label: 'Hoạt động' },
            { value: 'Inactive', label: 'Không HĐ' },
            { value: 'Suspended', label: 'Bị khóa' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterItem, statusFilter === item.value && styles.filterItemActive]}
              onPress={() => {
                setStatusFilter(item.value);
                setTimeout(() => loadStudents(0), 100);
              }}
            >
              <Text style={[styles.filterText, statusFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>Hiển thị {students.length} / {totalElements} sinh viên</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={students}
          renderItem={renderStudent}
          keyExtractor={(item) => item.studentId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadStudents(0, true)} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy sinh viên</Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  onPress={() => page > 0 && loadStudents(page - 1)}
                  disabled={page === 0}
                >
                  <Text style={styles.pageBtnText}>Trước</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                  onPress={() => page < totalPages - 1 && loadStudents(page + 1)}
                  disabled={page >= totalPages - 1}
                >
                  <Text style={styles.pageBtnText}>Sau</Text>
                </TouchableOpacity>
              </View>
            ) : null
          }
        />
      )}

      {/* Detail Modal */}
      <Modal visible={showDetailModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chi tiết sinh viên</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {studentDetail && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>MSSV:</Text>
                  <Text style={styles.detailValue}>{studentDetail.studentId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Họ tên:</Text>
                  <Text style={styles.detailValue}>{studentDetail.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{studentDetail.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SĐT:</Text>
                  <Text style={styles.detailValue}>{studentDetail.phoneNumber || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>{getStatusLabel(studentDetail.status)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số dư A4:</Text>
                  <Text style={styles.detailValue}>{studentDetail.a4Balance}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số dư A3:</Text>
                  <Text style={styles.detailValue}>{studentDetail.a3Balance}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tổng A4 tương đương:</Text>
                  <Text style={styles.detailValue}>{studentDetail.totalA4Equivalent}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tổng lệnh in:</Text>
                  <Text style={styles.detailValue}>{studentDetail.totalPrintJobs}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tổng trang đã in:</Text>
                  <Text style={styles.detailValue}>{studentDetail.totalPagesPrinted}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Lần in cuối:</Text>
                  <Text style={styles.detailValue}>{formatDate(studentDetail.lastPrintTime)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Đăng nhập cuối:</Text>
                  <Text style={styles.detailValue}>{formatDate(studentDetail.lastLogin)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>{formatDate(studentDetail.createdAt)}</Text>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Allocate Pages Modal */}
      <Modal visible={showAllocateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cấp trang cho {selectedStudent?.fullName}</Text>
              <TouchableOpacity onPress={() => setShowAllocateModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.inputLabel}>Số trang A4 *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập số trang A4"
                keyboardType="numeric"
                value={allocateA4}
                onChangeText={setAllocateA4}
              />
              <Text style={styles.inputLabel}>Số trang A3 (tùy chọn)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập số trang A3"
                keyboardType="numeric"
                value={allocateA3}
                onChangeText={setAllocateA3}
              />
              <Text style={styles.inputLabel}>Lý do (tùy chọn)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Nhập lý do cấp trang"
                multiline
                value={allocateReason}
                onChangeText={setAllocateReason}
              />
              <TouchableOpacity
                style={[styles.submitBtn, saving && styles.submitBtnDisabled]}
                onPress={submitAllocatePages}
                disabled={saving}
              >
                <Text style={styles.submitBtnText}>{saving ? 'Đang xử lý...' : 'Cấp trang'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Update Status Modal */}
      <Modal visible={showStatusModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Cập nhật trạng thái</Text>
              <TouchableOpacity onPress={() => setShowStatusModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.confirmText}>
                Bạn có chắc muốn {newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} sinh viên{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedStudent?.fullName}</Text>?
              </Text>
              <Text style={styles.inputLabel}>Lý do (tùy chọn)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Nhập lý do"
                multiline
                value={statusReason}
                onChangeText={setStatusReason}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowStatusModal(false)}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn, saving && styles.submitBtnDisabled]}
                  onPress={submitUpdateStatus}
                  disabled={saving}
                >
                  <Text style={styles.confirmBtnText}>{saving ? 'Đang xử lý...' : 'Xác nhận'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 16 },
  title: { fontSize: 22, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 4 },
  searchContainer: { padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchRow: { flexDirection: 'row', gap: 8 },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 12,
    gap: 8,
  },
  input: { flex: 1, height: 40, fontSize: 14 },
  searchBtn: {
    width: 40,
    height: 40,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterRow: { marginTop: 10 },
  filterItem: { paddingHorizontal: 14, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 16, marginRight: 8 },
  filterItemActive: { backgroundColor: '#7C3AED' },
  filterText: { fontSize: 13, color: '#374151' },
  filterTextActive: { color: '#fff', fontWeight: '600' },
  resultsBar: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F8FAFC' },
  resultsText: { fontSize: 12, color: '#6B7280' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 12 },
  studentCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  studentHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentId: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  studentEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 10, fontWeight: '600' },
  balanceRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  balanceItem: { alignItems: 'center' },
  balanceLabel: { fontSize: 11, color: '#6B7280' },
  balanceValue: { fontSize: 16, fontWeight: '700', color: '#111827', marginTop: 2 },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    justifyContent: 'space-around',
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 12, fontWeight: '500' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 16,
  },
  pageBtn: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#7C3AED', borderRadius: 8 },
  pageBtnDisabled: { backgroundColor: '#D1D5DB' },
  pageBtnText: { color: '#fff', fontWeight: '500' },
  pageInfo: { fontSize: 14, color: '#6B7280' },
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
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827', maxWidth: '60%', textAlign: 'right' },
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
  },
  submitBtnDisabled: { backgroundColor: '#A78BFA' },
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  confirmText: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#7C3AED' },
  confirmBtnText: { color: '#fff', fontWeight: '600' },
});
