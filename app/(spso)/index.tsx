import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, RefreshControl, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { spsoService, DashboardStats } from '../../services/spsoService';

const { width } = Dimensions.get('window');

export default function SPSODashboardScreen() {
  const router = useRouter();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const loadStats = useCallback(async () => {
    try {
      const data = await spsoService.getDashboardStats(selectedYear);
      setStats(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedYear]);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const StatCard = ({ icon, label, value, color, bg }: any) => (
    <View style={[styles.statCard, { backgroundColor: bg }]}>
      <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
        <Ionicons name={icon} size={20} color={color} />
      </View>
      <Text style={styles.statValue}>{value ?? '--'}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const maxWeeklyJobs = Math.max(...(stats?.weeklyStats?.map(s => s.jobs) || [1]), 1);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào, SPSO! 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity 
          style={styles.notificationBtn}
          onPress={() => router.push('/(spso)/more')}
        >
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadStats(); }} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <StatCard icon="print" label="Tổng lệnh in" value={stats?.totalJobs?.toLocaleString()} color="#3B82F6" bg="#EFF6FF" />
          <StatCard icon="checkmark-circle" label="Hoàn thành" value={stats?.completedJobs?.toLocaleString()} color="#10B981" bg="#ECFDF5" />
          <StatCard icon="close-circle" label="Thất bại" value={stats?.failedJobs?.toLocaleString()} color="#EF4444" bg="#FEF2F2" />
          <StatCard icon="time" label="Đang chờ" value={stats?.pendingJobs?.toLocaleString()} color="#F59E0B" bg="#FEF3C7" />
        </View>

        {/* Revenue Card */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <View style={styles.revenueIconContainer}>
              <Ionicons name="cash" size={24} color="#fff" />
            </View>
            <View>
              <Text style={styles.revenueLabel}>Doanh thu tháng này</Text>
              <Text style={styles.revenueValue}>
                {stats?.monthRevenue?.toLocaleString('vi-VN') ?? '--'}đ
              </Text>
            </View>
          </View>
          <View style={styles.revenueDivider} />
          <View style={styles.revenueTotalRow}>
            <Text style={styles.revenueTotalLabel}>Tổng doanh thu</Text>
            <Text style={styles.revenueTotalValue}>
              {stats?.totalRevenue?.toLocaleString('vi-VN') ?? '--'}đ
            </Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thao tác nhanh</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(spso)/students')}>
              <Ionicons name="people" size={20} color="#3B82F6" />
              <Text style={styles.actionText}>Sinh viên</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(spso)/printers')}>
              <Ionicons name="print" size={20} color="#10B981" />
              <Text style={styles.actionText}>Máy in</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(spso)/logs')}>
              <Ionicons name="list" size={20} color="#F59E0B" />
              <Text style={styles.actionText}>Nhật ký</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionBtn} onPress={() => router.push('/(spso)/reports')}>
              <Ionicons name="bar-chart" size={20} color="#A855F7" />
              <Text style={styles.actionText}>Báo cáo</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats Chart */}
        {stats?.weeklyStats && stats.weeklyStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lệnh in 7 ngày qua</Text>
            <View style={styles.chartCard}>
              <View style={styles.chartContainer}>
                {stats.weeklyStats.map((stat, index) => {
                  const height = stat.jobs > 0 ? Math.max((stat.jobs / maxWeeklyJobs) * 100, 10) : 5;
                  return (
                    <View key={index} style={styles.chartBar}>
                      <View style={styles.barContainer}>
                        <View style={[styles.bar, { height: `${height}%` }]} />
                      </View>
                      <Text style={styles.chartLabel}>{stat.day}</Text>
                      <Text style={styles.chartValue}>{stat.jobs}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        )}

        {/* Monthly Stats */}
        {stats?.monthlyStats && stats.monthlyStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thống kê theo tháng</Text>
            <View style={styles.monthlyCard}>
              {stats.monthlyStats.slice(-6).map((stat, index) => (
                <View key={index} style={styles.monthlyRow}>
                  <Text style={styles.monthlyMonth}>{stat.month}</Text>
                  <View style={styles.monthlyStats}>
                    <Text style={styles.monthlyJobs}>{stat.jobs} lệnh</Text>
                    <Text style={styles.monthlyRevenue}>{stat.revenue.toLocaleString('vi-VN')}đ</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Pages Stats */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thống kê trang in</Text>
          <View style={styles.pagesCard}>
            <View style={styles.pagesRow}>
              <View style={styles.pagesItem}>
                <Ionicons name="document-text" size={24} color="#3B82F6" />
                <Text style={styles.pagesValue}>{stats?.totalPages?.toLocaleString() ?? '--'}</Text>
                <Text style={styles.pagesLabel}>Tổng trang đã in</Text>
              </View>
              <View style={styles.pagesDivider} />
              <View style={styles.pagesItem}>
                <Ionicons name="sync" size={24} color="#10B981" />
                <Text style={styles.pagesValue}>{stats?.printingJobs ?? '--'}</Text>
                <Text style={styles.pagesLabel}>Đang in</Text>
              </View>
              <View style={styles.pagesDivider} />
              <View style={styles.pagesItem}>
                <Ionicons name="ban" size={24} color="#EF4444" />
                <Text style={styles.pagesValue}>{stats?.cancelledJobs ?? '--'}</Text>
                <Text style={styles.pagesLabel}>Đã hủy</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={{ height: 20 }} />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  notificationBtn: { padding: 8 },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: (width - 44) / 2,
    borderRadius: 16,
    padding: 16,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  revenueCard: {
    backgroundColor: '#7C3AED',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  revenueIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  revenueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  revenueValue: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginTop: 4 },
  revenueDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.2)', marginVertical: 16 },
  revenueTotalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  revenueTotalLabel: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },
  revenueTotalValue: { fontSize: 18, fontWeight: '600', color: '#fff' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionText: { fontSize: 11, color: '#374151', marginTop: 6, fontWeight: '500' },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartContainer: { flexDirection: 'row', justifyContent: 'space-around', height: 140 },
  chartBar: { alignItems: 'center', flex: 1 },
  barContainer: { flex: 1, width: 24, justifyContent: 'flex-end' },
  bar: { width: '100%', backgroundColor: '#7C3AED', borderRadius: 4 },
  chartLabel: { fontSize: 11, color: '#6B7280', marginTop: 8 },
  chartValue: { fontSize: 10, color: '#9CA3AF', marginTop: 2 },
  monthlyCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  monthlyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  monthlyMonth: { fontSize: 14, fontWeight: '500', color: '#374151' },
  monthlyStats: { alignItems: 'flex-end' },
  monthlyJobs: { fontSize: 13, color: '#6B7280' },
  monthlyRevenue: { fontSize: 14, fontWeight: '600', color: '#7C3AED', marginTop: 2 },
  pagesCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  pagesRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
  pagesItem: { alignItems: 'center', flex: 1 },
  pagesDivider: { width: 1, height: 60, backgroundColor: '#E5E7EB' },
  pagesValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  pagesLabel: { fontSize: 11, color: '#6B7280', marginTop: 4, textAlign: 'center' },
});
