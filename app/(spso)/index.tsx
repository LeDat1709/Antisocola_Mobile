import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spsoService, DashboardStats } from '../../services/spsoService';

export default function SPSODashboardScreen() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = async () => {
    try {
      const data = await spsoService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const StatCard = ({ icon, label, value, color, bg }: any) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <Ionicons name={icon} size={24} color={color} />
      <Text style={styles.statValue}>{value ?? '--'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard SPSO</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStats} />}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="print" label="Tổng lệnh in" value={stats?.totalJobs} color="#3B82F6" bg="#EFF6FF" />
          <StatCard icon="checkmark-circle" label="Hoàn thành" value={stats?.completedJobs} color="#10B981" bg="#ECFDF5" />
          <StatCard icon="close-circle" label="Thất bại" value={stats?.failedJobs} color="#EF4444" bg="#FEF2F2" />
          <StatCard icon="time" label="Đang chờ" value={stats?.pendingJobs} color="#F59E0B" bg="#FEF3C7" />
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={24} color="#fff" />
            <Text style={styles.revenueLabel}>Doanh thu tháng này</Text>
          </View>
          <Text style={styles.revenueValue}>
            {stats?.monthRevenue?.toLocaleString('vi-VN') ?? '--'}đ
          </Text>
          <Text style={styles.revenueTotal}>
            Tổng: {stats?.totalRevenue?.toLocaleString('vi-VN') ?? '--'}đ
          </Text>
        </View>

        {/* Pages Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê trang in</Text>
          <View style={styles.pagesCard}>
            <View style={styles.pagesRow}>
              <Text style={styles.pagesLabel}>Tổng số trang đã in</Text>
              <Text style={styles.pagesValue}>{stats?.totalPages?.toLocaleString() ?? '--'}</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  revenueCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revenueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  revenueValue: { fontSize: 36, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  revenueTotal: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  pagesCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pagesRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pagesLabel: { fontSize: 14, color: '#6B7280' },
  pagesValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
});
