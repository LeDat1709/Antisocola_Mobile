import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput,
  RefreshControl, Modal, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spsoService, Transaction } from '../../services/spsoService';

export default function TransactionsScreen() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Stats
  const [stats, setStats] = useState({ totalAll: 0, totalAllocate: 0, totalPurchase: 0, totalUse: 0 });

  // Detail Modal
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const loadTransactions = useCallback(async (pageNum = 0, isRefresh = false, isInitial = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const filters: any = {};
      if (keyword) filters.keyword = keyword;
      if (typeFilter) filters.type = typeFilter;

      const data = await spsoService.getTransactions(pageNum, 20, filters);
      setTransactions(data.content);
      setTotalPages(data.totalPages || 1);
      setPage(pageNum);

      if (isInitial) {
        setStats({
          totalAll: data.totalAllocateTransactions + data.totalPurchaseTransactions + data.totalUseTransactions,
          totalAllocate: data.totalAllocateTransactions,
          totalPurchase: data.totalPurchaseTransactions,
          totalUse: data.totalUseTransactions,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [keyword, typeFilter]);

  useEffect(() => {
    loadTransactions(0, false, true);
  }, []);

  const handleSearch = () => {
    loadTransactions(0);
  };

  const handleViewDetail = async (transaction: Transaction) => {
    try {
      const detail = await spsoService.getTransactionDetail(transaction.transactionId);
      setSelectedTransaction(detail);
      setShowDetailModal(true);
    } catch (error) {
      setSelectedTransaction(transaction);
      setShowDetailModal(true);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = { Allocate: 'Cấp phát', Purchase: 'Mua thêm', Use: 'Khấu trừ' };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Allocate: { bg: '#DBEAFE', text: '#1D4ED8' },
      Purchase: { bg: '#D1FAE5', text: '#059669' },
      Use: { bg: '#FED7AA', text: '#C2410C' },
    };
    return colors[type] || { bg: '#E5E7EB', text: '#374151' };
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string }> = {
      Completed: { bg: '#D1FAE5', text: '#059669' },
      Pending: { bg: '#FEF3C7', text: '#D97706' },
      Failed: { bg: '#FEE2E2', text: '#DC2626' },
    };
    return colors[status] || { bg: '#E5E7EB', text: '#374151' };
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.toLocaleDateString('vi-VN')} ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`;
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Giao dịch</Text>
      </View>

      {/* Stats */}
      <View style={styles.statsContainer}>
        <View style={[styles.statCard, { backgroundColor: '#F3F4F6' }]}>
          <Text style={styles.statValue}>{stats.totalAll}</Text>
          <Text style={styles.statLabel}>Tổng</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#DBEAFE' }]}>
          <Text style={[styles.statValue, { color: '#1D4ED8' }]}>{stats.totalAllocate}</Text>
          <Text style={[styles.statLabel, { color: '#1D4ED8' }]}>Cấp phát</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
          <Text style={[styles.statValue, { color: '#059669' }]}>{stats.totalPurchase}</Text>
          <Text style={[styles.statLabel, { color: '#059669' }]}>Mua thêm</Text>
        </View>
        <View style={[styles.statCard, { backgroundColor: '#FED7AA' }]}>
          <Text style={[styles.statValue, { color: '#C2410C' }]}>{stats.totalUse}</Text>
          <Text style={[styles.statLabel, { color: '#C2410C' }]}>Khấu trừ</Text>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchRow}>
          <View style={styles.searchInput}>
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              style={styles.input}
              placeholder="Tìm theo mã GD, MSSV..."
              value={keyword}
              onChangeText={setKeyword}
              onSubmitEditing={handleSearch}
            />
          </View>
          <TouchableOpacity style={styles.searchBtn} onPress={handleSearch}>
            <Ionicons name="search" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Type Filter */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
          {[
            { value: '', label: 'Tất cả' },
            { value: 'Allocate', label: 'Cấp phát' },
            { value: 'Purchase', label: 'Mua thêm' },
            { value: 'Use', label: 'Khấu trừ' },
          ].map((item) => (
            <TouchableOpacity
              key={item.value}
              style={[styles.filterItem, typeFilter === item.value && styles.filterItemActive]}
              onPress={() => {
                setTypeFilter(item.value);
                setTimeout(() => loadTransactions(0), 100);
              }}
            >
              <Text style={[styles.filterText, typeFilter === item.value && styles.filterTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => loadTransactions(0, true)} />}
        >
          {transactions.map((item) => {
            const typeColor = getTypeColor(item.transactionType);
            const statusColor = getStatusColor(item.transactionStatus);
            return (
              <TouchableOpacity
                key={item.transactionId}
                style={styles.transactionCard}
                onPress={() => handleViewDetail(item)}
                activeOpacity={0.7}
              >
                <View style={styles.transactionHeader}>
                  <View>
                    <Text style={styles.transactionCode}>{item.transactionCode}</Text>
                    <Text style={styles.studentInfo}>{item.studentId} - {item.studentName}</Text>
                  </View>
                  <View style={[styles.typeBadge, { backgroundColor: typeColor.bg }]}>
                    <Text style={[styles.typeText, { color: typeColor.text }]}>{getTypeLabel(item.transactionType)}</Text>
                  </View>
                </View>
                <View style={styles.transactionBody}>
                  <View style={styles.transactionRow}>
                    <Text style={styles.label}>Số trang A4:</Text>
                    <Text style={[styles.value, { color: item.transactionType === 'Use' ? '#DC2626' : '#059669' }]}>
                      {item.transactionType === 'Use' ? '-' : '+'}{item.a4Pages}
                    </Text>
                  </View>
                  <View style={styles.transactionRow}>
                    <Text style={styles.label}>Số dư sau:</Text>
                    <Text style={styles.value}>{item.balanceAfterA4 ?? '-'}</Text>
                  </View>
                  {item.amount && (
                    <View style={styles.transactionRow}>
                      <Text style={styles.label}>Số tiền:</Text>
                      <Text style={styles.value}>{formatCurrency(item.amount)}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.transactionFooter}>
                  <Text style={styles.dateText}>{formatDate(item.createdAt)}</Text>
                  <View style={[styles.statusBadge, { backgroundColor: statusColor.bg }]}>
                    <Text style={[styles.statusText, { color: statusColor.text }]}>
                      {item.transactionStatus === 'Completed' ? 'Hoàn thành' : item.transactionStatus}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.pageBtn, page === 0 && styles.pageBtnDisabled]}
                onPress={() => page > 0 && loadTransactions(page - 1)}
                disabled={page === 0}
              >
                <Text style={styles.pageBtnText}>Trước</Text>
              </TouchableOpacity>
              <Text style={styles.pageInfo}>{page + 1} / {totalPages}</Text>
              <TouchableOpacity
                style={[styles.pageBtn, page >= totalPages - 1 && styles.pageBtnDisabled]}
                onPress={() => page < totalPages - 1 && loadTransactions(page + 1)}
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
              <Text style={styles.modalTitle}>Chi tiết giao dịch</Text>
              <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            {selectedTransaction && (
              <ScrollView style={styles.modalBody}>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Mã GD:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.transactionCode}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Sinh viên:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.studentId}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tên:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.studentName}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Loại:</Text>
                  <Text style={styles.detailValue}>{getTypeLabel(selectedTransaction.transactionType)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số trang A4:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.a4Pages}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số dư sau:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.balanceAfterA4 ?? '-'}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Số tiền:</Text>
                  <Text style={styles.detailValue}>{formatCurrency(selectedTransaction.amount)}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Trạng thái:</Text>
                  <Text style={styles.detailValue}>{selectedTransaction.transactionStatus}</Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Ngày tạo:</Text>
                  <Text style={styles.detailValue}>{formatDate(selectedTransaction.createdAt)}</Text>
                </View>
                {selectedTransaction.notes && (
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Ghi chú:</Text>
                    <Text style={styles.detailValue}>{selectedTransaction.notes}</Text>
                  </View>
                )}
              </ScrollView>
            )}
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
  statsContainer: { flexDirection: 'row', padding: 12, gap: 8 },
  statCard: { flex: 1, borderRadius: 10, padding: 10, alignItems: 'center' },
  statValue: { fontSize: 18, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 10, color: '#6B7280', marginTop: 2 },
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
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, padding: 12 },
  transactionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  transactionHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 10 },
  transactionCode: { fontSize: 13, fontFamily: 'monospace', color: '#111827', fontWeight: '600' },
  studentInfo: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  typeText: { fontSize: 11, fontWeight: '600' },
  transactionBody: { borderTopWidth: 1, borderTopColor: '#F3F4F6', paddingTop: 10 },
  transactionRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { fontSize: 13, color: '#6B7280' },
  value: { fontSize: 13, fontWeight: '600', color: '#111827' },
  transactionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  dateText: { fontSize: 12, color: '#9CA3AF' },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: '500' },
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
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
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
});
