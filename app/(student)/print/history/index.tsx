import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { printJobService, PrintJob } from '../../../../services/printJobService';

export default function PrintHistoryScreen() {
  const router = useRouter();
  const [jobs, setJobs] = useState<PrintJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadJobs = async () => {
    try {
      const data = await printJobService.getMyPrintJobs();
      setJobs(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  const getStatusInfo = (status: string) => {
    switch (status) {
      case 'Completed': return { color: '#10B981', label: 'Hoàn thành', icon: 'checkmark-circle' };
      case 'Pending': return { color: '#F59E0B', label: 'Chờ xử lý', icon: 'time' };
      case 'Printing': return { color: '#3B82F6', label: 'Đang in', icon: 'print' };
      case 'Failed': return { color: '#EF4444', label: 'Thất bại', icon: 'close-circle' };
      case 'Cancelled': return { color: '#6B7280', label: 'Đã hủy', icon: 'ban' };
      default: return { color: '#6B7280', label: status, icon: 'help-circle' };
    }
  };

  const renderJob = ({ item }: { item: PrintJob }) => {
    const statusInfo = getStatusInfo(item.jobStatus);
    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => router.push(`/(student)/print/history/${item.jobId}`)}
      >
        <View style={styles.jobIcon}>
          <Ionicons name="document-text" size={24} color="#3B82F6" />
        </View>
        <View style={styles.jobInfo}>
          <Text style={styles.jobName} numberOfLines={1}>
            {item.documentName || `Tài liệu #${item.documentId}`}
          </Text>
          <Text style={styles.jobMeta}>
            {item.totalPagesToPrint} trang • {item.paperSize} • {item.numCopies} bản
          </Text>
          <Text style={styles.jobDate}>
            {new Date(item.submittedAt).toLocaleString('vi-VN')}
          </Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color + '20' }]}>
          <Ionicons name={statusInfo.icon as any} size={14} color={statusInfo.color} />
          <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Lịch sử in</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={jobs}
        renderItem={renderJob}
        keyExtractor={(item) => item.jobId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadJobs(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="print-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có lệnh in nào</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 8 },
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  list: { padding: 16 },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: { flex: 1, marginLeft: 12 },
  jobName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  jobMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  jobDate: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  statusText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
