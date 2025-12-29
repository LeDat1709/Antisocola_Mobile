import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Modal, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
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

  // Modals
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [accountDetail, setAccountDetail] = useState<AccountDetail | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [allocatePages, setAllocatePages] = useState('');
  const [allocateReason, setAllocateReason] = useState('');
  const [newStatus, setNewStatus] = useState('');

  const loadAccounts = useCallback(async (pageNum = 0, isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (userTypeFilter) filters.userType = userTypeFilter;
      if (statusFilter) filters.status = statusFilter;

      const data = await spsoService.getAccounts(pageNum, 20, filters);
      setAccounts(data.content);
      setTotalPages(data.totalPages || 1);
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
    setAllocatePages('');
    setAllocateReason('');
    setShowAllocateModal(true);
  };

  const handleUpdateStatus = (account: Account) => {
    setSelectedAccount(account);
    setNewStatus(account.status === 'Active' ? 'Inactive' : 'Active');
    setShowStatusModal(true);
  };

  const submitAllocatePages = async () => {
    if (!selectedAccount || !allocatePages) return;
    try {
      await spsoService.allocatePages(selectedAccount.userId, parseInt(allocatePages), allocateReason);
      Alert.alert('Thành công', 'Đã cấp trang thành công');
      setShowAllocateModal(false);
      loadAccounts(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cấp trang');
    }
  };

  const submitUpdateStatus = async () => {
    if (!selectedAccount) return;
    try {
      await spsoService.updateAccountStatus(selectedAccount.userId, newStatus);
      Alert.alert('Thành công', 'Đã cập nhật trạng thái');
      setShowStatusModal(false);
      loadAccounts(page);
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật trạng thái');
    }
  };

  const getRoleBadge = (userType: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      Student: { bg: '#DBEAFE', text: '#1D4ED8' },
      SPSO: { bg: '#F3E8FF', text: '#7C3AED' },
      Admin: { bg: '#FED7AA', text: '#C2410C' },
    };
    return styles[userType] || { bg: '#E5E7EB', text: '#374151' };
  };

  const getStatusBadge = (status: string) => {
    return status === 'Active'
      ? { bg: '#D1FAE5', text: '#059669' }
      : { bg: '#E5E7EB', text: '#6B7280' };
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Quản lý tài khoản</Text>
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
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadAccounts(0, true)} />}
        >
          {accounts.map((account) => {
            const roleBadge = getRoleBadge(account.userType);
            const statusBadge = getStatusBadge(account.status);
            return (
              <View key={account.userId} style={styles.accountCard}>
                <View style={styles.accountHeader}>
                  <View style={styles.accountInfo}>
                    <Text style={styles.accountId}>{account.userId}</Text>
                    <Text style={styles.accountName}>{account.fullName}</Text>
                    <Text style={styles.accountEmail}>{account.email}</Text>
                  </View>
                  <View style={styles.badges}>
                    <View style={[styles.badge, { backgroundColor: roleBadge.bg }]}>
                      <Text style={[styles.badgeText, { color: roleBadge.text }]}>
                        {account.userType === 'Student' ? 'SV' : account.userType}
                      </Text>
                    </View>
                    <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
                      <Text style={[styles.badgeText, { color: statusBadge.text }]}>
                        {account.status === 'Active' ? 'HĐ' : 'KHĐ'}
                      </Text>
                    </View>
                  </View>
                </View>

                {account.userType === 'Student' && (
                  <View style={styles.balanceRow}>
                    <Text style={styles.balanceLabel}>Số dư:</Text>
                    <Text style={styles.balanceValue}>{account.a4Balance ?? 0} A4</Text>
                  </View>
                )}

                <View style={styles.actionRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleViewDetail(account)}>
                    <Ionicons name="eye-outline" size={18} color="#3B82F6" />
                    <Text style={[styles.actionText, { color: '#3B82F6' }]}>Chi tiết</Text>
                  </TouchableOpacity>
                  {account.userType === 'Student' && (
                    <TouchableOpacity style={styles.actionBtn} onPress={() => handleAllocatePages(account)}>
                      <Ionicons name="document-text-outline" size={18} color="#10B981" />
                      <Text style={[styles.actionText, { color: '#10B981' }]}>Cấp trang</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity style={styles.actionBtn} onPress={() => handleUpdateStatus(account)}>
                    <Ionicons name="toggle-outline" size={18} color="#F59E0B" />
                    <Text style={[styles.actionText, { color: '#F59E0B' }]}>Trạng thái</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
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
          )}
        </ScrollView>
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
                  <Text style={styles.detailValue}>{accountDetail.userType}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>{accountDetail.status}</Text>
                </View>
                {accountDetail.userType === 'Student' && (
                  <>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Số dư A4:</Text>
                      <Text style={styles.detailValue}>{accountDetail.a4Balance ?? 0}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Tổng lệnh in:</Text>
                      <Text style={styles.detailValue}>{accountDetail.totalPrintJobs ?? 0}</Text>
                    </View>
                  </>
                )}
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
              <Text style={styles.inputLabel}>Số trang A4</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập số trang"
                keyboardType="numeric"
                value={allocatePages}
                onChangeText={setAllocatePages}
              />
              <Text style={styles.inputLabel}>Lý do (tùy chọn)</Text>
              <TextInput
                style={[styles.modalInput, { height: 80 }]}
                placeholder="Nhập lý do cấp trang"
                multiline
                value={allocateReason}
                onChangeText={setAllocateReason}
              />
              <TouchableOpacity style={styles.submitBtn} onPress={submitAllocatePages}>
                <Text style={styles.submitBtnText}>Cấp trang</Text>
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
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalBtn, styles.cancelBtn]}
                  onPress={() => setShowStatusModal(false)}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalBtn, styles.confirmBtn]} onPress={submitUpdateStatus}>
                  <Text style={styles.confirmBtnText}>Xác nhận</Text>
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
  searchContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
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
  input: { flex: 1, height: 44, fontSize: 14 },
  searchBtn: {
    width: 44,
    height: 44,
    backgroundColor: '#7C3AED',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 16 },
  accountCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  accountHeader: { flexDirection: 'row', justifyContent: 'space-between' },
  accountInfo: { flex: 1 },
  accountId: { fontSize: 12, color: '#6B7280', fontFamily: 'monospace' },
  accountName: { fontSize: 16, fontWeight: '600', color: '#111827', marginTop: 2 },
  accountEmail: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  badges: { flexDirection: 'row', gap: 6 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  badgeText: { fontSize: 11, fontWeight: '600' },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  balanceLabel: { fontSize: 13, color: '#6B7280' },
  balanceValue: { fontSize: 14, fontWeight: '600', color: '#111827', marginLeft: 8 },
  actionRow: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 16,
  },
  actionBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actionText: { fontSize: 13, fontWeight: '500' },
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
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
  submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  confirmText: { fontSize: 15, color: '#374151', textAlign: 'center', lineHeight: 22 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  cancelBtn: { backgroundColor: '#F3F4F6' },
  cancelBtnText: { color: '#374151', fontWeight: '600' },
  confirmBtn: { backgroundColor: '#7C3AED' },
  confirmBtnText: { color: '#fff', fontWeight: '600' },
});
