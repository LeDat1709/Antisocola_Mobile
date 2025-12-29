import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput,
  RefreshControl, Modal, Alert, ActivityIndicator, ScrollView
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spsoService, Account, AccountDetail } from '../../services/spsoService';

export default function AccountsScreen() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [userTypeFilter, setUserTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Modals
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [allocateA4, setAllocateA4] = useState('');
  const [allocateReason, setAllocateReason] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusReason, setStatusReason] = useState('');
  const [newRole, setNewRole] = useState('');
  const [roleReason, setRoleReason] = useState('');
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (userTypeFilter) filters.userType = userTypeFilter;
      if (statusFilter) filters.status = statusFilter;
      filters.sortBy = 'userId';
      filters.sortDirection = 'ASC';

      const data = await spsoService.getAccounts(pageNum, 20, filters);
      setAccounts(data.content);
      setTotalPages(data.totalPages || 1);
      setTotalElements(data.totalElements);
      setPage(pageNum);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, userTypeFilter, statusFilter]);

  useEffect(() => {
    loadAccounts();
  }, []);

  const handleSearch = () => {
    loadAccounts(0);
  };

  const handleViewDetail = async (account: Account) => {
    setSelectedAccount(account);
    try {
      const detail = await spsoService.getAccountDetail(account.userId);
      setAccountDetail(detail);
      setShowDetailModal(true);
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể tải chi tiết tài khoản');
    }
  };

  const handleAllocatePages = (account: Account) => {
    if (account.userType !== 'Student') {
      Alert.alert('Thông báo', 'Chỉ có thể cấp trang cho sinh viên');
      return;
    }
    setSelectedAccount(account);
    setAllocateA4('');
    setAllocateReason('');
    setShowAllocateModal(true);
  };

  const handleUpdateStatus = (account: Account) => {
    setSelectedAccount(account);
    setNewStatus(account.status === 'Active' ? 'Inactive' : 'Active');
    setStatusReason('');
    setShowStatusModal(true);
  };

  const handleUpdateRole = (account: Account) => {
    setSelectedAccount(account);
    setNewRole(account.userType === 'Student' ? 'SPSO' : 'Student');
    setRoleReason('');
    setShowRoleModal(true);
  };

  const submitAllocatePages = async () => {
    if (!selectedAccount) return;
    const a4 = parseInt(allocateA4) || 0;
    if (a4 <= 0) {
      Alert.alert('Lỗi', 'Vui lòng nhập số trang cần cấp');
      return;
    }
    try {
      setSaving(true);
      await spsoService.allocatePages(selectedAccount.userId, a4, 0, allocateReason);
      Alert.alert('Thành công', `Đã cấp ${a4} trang A4 cho ${selectedAccount.fullName}`);
      setShowAllocateModal(false);
      loadAccounts(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cấp trang');
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateStatus = async () => {
    if (!selectedAccount) return;
    try {
      setSaving(true);
      await spsoService.updateAccountStatus(selectedAccount.userId, newStatus, statusReason);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái tài khoản');
      setShowStatusModal(false);
      loadAccounts(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái');
    } finally {
      setSaving(false);
    }
  };

  const submitUpdateRole = async () => {
    if (!selectedAccount) return;
    try {
      setSaving(true);
      await spsoService.updateAccountRole(selectedAccount.userId, newRole, roleReason);
      Alert.alert('Thành công', 'Đã cập nhật role tài khoản');
      setShowRoleModal(false);
      loadAccounts(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật role');
    } finally {
      setSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      Active: { bg: '#D1FAE5', text: '#059669' },
      Inactive: { bg: '#E5E7EB', text: '#6B7280' },
    };
    return styles[status] || { bg: '#E5E7EB', text: '#6B7280' };
  };

  const getRoleBadge = (userType: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      Student: { bg: '#DBEAFE', text: '#2563EB' },
      SPSO: { bg: '#F3E8FF', text: '#7C3AED' },
      Admin: { bg: '#FEF3C7', text: '#D97706' },
    };
    return styles[userType] || { bg: '#E5E7EB', text: '#6B7280' };
  };

  const getRoleLabel = (userType: string) => {
    const labels: Record<string, string> = {
      Student: 'Sinh viên',
      SPSO: 'SPSO',
      Admin: 'Admin',
    };
    return labels[userType] || userType;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      Active: 'Hoạt động',
      Inactive: 'Không HĐ',
    };
    return labels[status] || status;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleString('vi-VN');
  };

  const renderAccount = ({ item }: { item: Account }) => {
    const statusBadge = getStatusBadge(item.status);
    const roleBadge = getRoleBadge(item.userType);
    const isStudent = item.userType === 'Student';
    const isSPSO = item.userType === 'SPSO';

    return (
      <View style={styles.accountCard}>
        <View style={styles.accountHeader}>
          <View style={[styles.avatar, { backgroundColor: roleBadge.text }]}>
            <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.accountInfo}>
            <Text style={styles.accountId}>{item.userId}</Text>
            <Text style={styles.accountName}>{item.fullName}</Text>
            <Text style={styles.accountEmail}>{item.email}</Text>
          </View>
          <View style={styles.badgeContainer}>
            <View style={[styles.roleBadge, { backgroundColor: roleBadge.bg }]}>
              <Text style={[styles.roleText, { color: roleBadge.text }]}>{getRoleLabel(item.userType)}</Text>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.statusText, { color: statusBadge.text }]}>{getStatusLabel(item.status)}</Text>
            </View>
          </View>
        </View>

        {isStudent && (
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Số dư A4</Text>
              <Text style={styles.balanceValue}>{item.a4Balance ?? 0}</Text>
            </View>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceLabel}>Số lần in</Text>
              <Text style={styles.balanceValue}>{item.totalPrintJobs ?? 0}</Text>
            </View>
          </View>
        )}

        <View style={styles.actionRow}>
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetail(item)}>
            <Ionicons name="eye-outline" size={18} color="#3B82F6" />
            <Text style={[styles.actionText, { color: '#3B82F6' }]}>Chi tiết</Text>
          </TouchableOpacity>
          
          {/* Chỉ hiển thị nút Cấp trang cho Student */}
          {isStudent && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleAllocatePages(item)}>
              <Ionicons name="add-circle-outline" size={18} color="#10B981" />
              <Text style={[styles.actionText, { color: '#10B981' }]}>Cấp trang</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(item)}>
            <Ionicons name="toggle-outline" size={18} color="#F59E0B" />
            <Text style={[styles.actionText, { color: '#F59E0B' }]}>Trạng thái</Text>
          </TouchableOpacity>
          
          {/* Không hiển thị nút đổi role cho SPSO */}
          {!isSPSO && (
            <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateRole(item)}>
              <Ionicons name="swap-horizontal-outline" size={18} color="#A855F7" />
              <Text style={[styles.actionText, { color: '#A855F7' }]}>Đổi role</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý tài khoản</Text>
        <Text style={styles.subtitle}>Quản lý tất cả tài khoản (Student, SPSO, Admin)</Text>
      </View>

      {/* Search & Filters */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Tìm theo ID, email, tên..."
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* User Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { value: '', label: 'Tất cả' },
            { value: 'Student', label: 'Sinh viên' },
            { value: 'SPSO', label: 'SPSO' },
            { value: 'Admin', label: 'Admin' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterItem, userTypeFilter === item.value && styles.filterItemActive]}
              onPress={() => {
                setUserTypeFilter(item.value);
                setTimeout(() => loadAccounts(0), 100);
              }}
            >
              <Text style={[styles.filterText, userTypeFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Results count */}
      <View style={styles.resultsBar}>
        <Text style={styles.resultsText}>Hiển thị {accounts.length} / {totalElements} tài khoản</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <FlatList
          data={accounts}
          renderItem={renderAccount}
          keyExtractor={(item) => item.userId}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAccounts(0, true)} />}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy tài khoản</Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <TouchableOpacity
                  style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                  onPress={() => page > 0 && loadAccounts(page - 1)}
                  disabled={page === 0}
                >
                  <Text style={styles.pageBtnText}>Trước</Text>
                </TouchableOpacity>
                <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
                <TouchableOpacity
                  style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                  onPress={() => page < totalPages - 1 && loadAccounts(page + 1)}
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
              <Text style={styles.modalTitle}>Chi tiết tài khoản</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {accountDetail && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>ID:</Text>
                  <Text style={styles.detailValue}>{accountDetail.userId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Họ tên:</Text>
                  <Text style={styles.detailValue}>{accountDetail.fullName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Email:</Text>
                  <Text style={styles.detailValue}>{accountDetail.email}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>SĐT:</Text>
                  <Text style={styles.detailValue}>{accountDetail.phoneNumber || 'Chưa cập nhật'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại TK:</Text>
                  <Text style={styles.detailValue}>{getRoleLabel(accountDetail.userType)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>{getStatusLabel(accountDetail.status)}</Text>
                </View>
                {accountDetail.userType === 'Student' && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Số dư A4:</Text>
                      <Text style={styles.detailValue}>{accountDetail.a4Balance}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tổng lệnh in:</Text>
                      <Text style={styles.detailValue}>{accountDetail.totalPrintJobs}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tổng trang đã in:</Text>
                      <Text style={styles.detailValue}>{accountDetail.totalPagesPrinted}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Lần in cuối:</Text>
                      <Text style={styles.detailValue}>{formatDate(accountDetail.lastPrintTime)}</Text>
                    </View>
                  </>
                )}
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Đăng nhập cuối:</Text>
                  <Text style={styles.detailValue}>{formatDate(accountDetail.lastLogin)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>{formatDate(accountDetail.createdAt)}</Text>
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
              <Text style={styles.modalTitle}>Cấp trang cho {selectedAccount?.fullName}</Text>
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
                Bạn có chắc muốn {newStatus === 'Active' ? 'kích hoạt' : 'vô hiệu hóa'} tài khoản{' '}
                <Text style={{ fontWeight: 'bold' }}>{selectedAccount?.fullName}</Text>?
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

      {/* Update Role Modal */}
      <Modal visible={showRoleModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi role tài khoản</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.confirmText}>
                Đổi role của <Text style={{ fontWeight: 'bold' }}>{selectedAccount?.fullName}</Text>{'\n'}
                từ <Text style={{ fontWeight: 'bold' }}>{getRoleLabel(selectedAccount?.userType || '')}</Text>{' '}
                sang <Text style={{ fontWeight: 'bold' }}>{getRoleLabel(newRole)}</Text>?
              </Text>
              <Text style={styles.inputLabel}>Lý do (tùy chọn)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Nhập lý do"
                multiline
                value={roleReason}
                onChangeText={setRoleReason}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity style={[styles.modalBtn, styles.cancelBtn]} onPress={() => setShowRoleModal(false)}>
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.confirmBtn, saving && styles.submitBtnDisabled]}
                  onPress={submitUpdateRole}
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
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  accountInfo: { flex: 1, marginLeft: 12 },
  accountId: { fontSize: 11, color: '#6B7280', fontFamily: 'monospace' },
  accountName: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 2 },
  accountEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  badgeContainer: { alignItems: 'flex-end', gap: 4 },
  roleBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  roleText: { fontSize: 10, fontWeight: '600' },
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
    flexWrap: 'wrap',
    gap: 8,
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
