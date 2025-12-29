import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pageBalanceService, PageBalance } from '../../services/pageBalanceService';
import { printJobService, PrintJob } from '../../services/printJobService';

export default function DashboardScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<PageBalance | null>(null);
  const [recentJobs, setRecentJobs] = useState<PrintJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    try {
      const [balanceData, jobsData] = await Promise.all([
        pageBalanceService.getBalance(),
        printJobService.getMyPrintJobs(),
      ]);
      setBalance(balanceData);
      setRecentJobs(jobsData.slice(0, 3));
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Completed': return '#10B981';
      case 'Pending': return '#F59E0B';
      case 'Printing': return '#3B82F6';
      case 'Failed': return '#EF4444';
      default: return '#6B7280';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào! 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity style={styles.notificationBtn}>
          <Ionicons name="notifications-outline" size={24} color="#374151" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Balance Card */}
        <TouchableOpacity
          style={styles.balanceCard}
          onPress={() => router.push('/(student)/balance')}
        >
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={24} color="#fff" />
            <Text style={styles.balanceLabel}>Số dư trang in</Text>
          </View>
          <Text style={styles.balanceValue}>{balance?.pagesA4 ?? '--'}</Text>
          <Text style={styles.balanceUnit}>trang A4</Text>
        </TouchableOpacity>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsGrid}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/print/upload')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="cloud-upload" size={24} color="#3B82F6" />
              </View>
              <Text style={styles.actionText}>Upload tài liệu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/printers')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#F0FDF4' }]}>
                <Ionicons name="print" size={24} color="#10B981" />
              </View>
              <Text style={styles.actionText}>Chọn máy in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/print/history')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="time" size={24} color="#F59E0B" />
              </View>
              <Text style={styles.actionText}>Lịch sử in</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/balance/buy')}
            >
              <View style={[styles.actionIcon, { backgroundColor: '#FCE7F3' }]}>
                <Ionicons name="card" size={24} color="#EC4899" />
              </View>
              <Text style={styles.actionText}>Mua trang</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Print Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lệnh in gần đây</Text>
            <TouchableOpacity onPress={() => router.push('/(student)/print/history')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có lệnh in nào</Text>
            </View>
          ) : (
            recentJobs.map((job) => (
              <TouchableOpacity
                key={job.jobId}
                style={styles.jobCard}
                onPress={() => router.push(`/(student)/print/history/${job.jobId}`)}
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="document-text" size={20} color="#6B7280" />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobName} numberOfLines={1}>
                    {job.documentName || `Tài liệu #${job.documentId}`}
                  </Text>
                  <Text style={styles.jobMeta}>
                    {job.totalPagesToPrint} trang • {job.paperSize}
                  </Text>
                </View>
                <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.jobStatus) + '20' }]}>
                  <Text style={[styles.jobStatusText, { color: getStatusColor(job.jobStatus) }]}>
                    {job.jobStatus}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  greeting: { fontSize: 14, color: '#6B7280' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  notificationBtn: { padding: 8 },
  content: { flex: 1, padding: 16 },
  balanceCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontSize: 48, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  balanceUnit: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  actionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  actionCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  jobCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  jobIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  jobInfo: { flex: 1, marginLeft: 12 },
  jobName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  jobMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  jobStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  jobStatusText: { fontSize: 11, fontWeight: '600' },
});
