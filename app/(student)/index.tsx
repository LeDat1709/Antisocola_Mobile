import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pageBalanceService, PageBalance } from '../../services/pageBalanceService';
import { printJobService, PrintJob } from '../../services/printJobService';
import { notificationService } from '../../services/notificationService';

interface WeeklyStat {
  day: string;
  success: number;
  failed: number;
}

interface JobStatusCounts {
  completed: number;
  failed: number;
  printing: number;
  pending: number;
  cancelled: number;
}

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<PageBalance | null>(null);
  const [printJobs, setPrintJobs] = useState<PrintJob[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [weeklyStats, setWeeklyStats] = useState<WeeklyStat[]>([]);
  const [successRate, setSuccessRate] = useState({ success: 0, failed: 0 });
  const [monthlyStats, setMonthlyStats] = useState({ jobs: 0, pages: 0 });
  const [jobStatusCounts, setJobStatusCounts] = useState<JobStatusCounts>({
    completed: 0,
    failed: 0,
    printing: 0,
    pending: 0,
    cancelled: 0,
  });
  const [favoritePrinter, setFavoritePrinter] = useState<string>('--');
  const [unreadCount, setUnreadCount] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [balanceData, jobsData, unreadData] = await Promise.all([
        pageBalanceService.getBalance().catch((err) => {
          console.log('Balance error:', err);
          return null;
        }),
        printJobService.getMyPrintJobs().catch((err) => {
          console.log('Jobs error:', err);
          return [];
        }),
        notificationService.getUnreadCount().catch((err) => {
          console.log('Unread count error:', err);
          return 0;
        }),
      ]);
      if (balanceData) setBalance(balanceData);
      setPrintJobs(jobsData || []);
      setUnreadCount(unreadData);
      calculateStats(jobsData || []);
    } catch (error) {
      console.error('Load data error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const calculateStats = (jobs: PrintJob[]) => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Monthly stats
    const monthJobs = jobs.filter((job) => {
      const jobDate = new Date(job.submittedAt);
      return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
    });
    const monthPages = monthJobs.reduce((sum, job) => sum + (job.a4EquivalentPages || job.totalPagesToPrint || 0), 0);
    setMonthlyStats({ jobs: monthJobs.length, pages: monthPages });

    // Job status counts
    const completed = jobs.filter((j) => j.jobStatus === 'Completed').length;
    const failed = jobs.filter((j) => j.jobStatus === 'Failed').length;
    const printing = jobs.filter((j) => j.jobStatus === 'Printing').length;
    const pending = jobs.filter((j) => j.jobStatus === 'Pending').length;
    const cancelled = jobs.filter((j) => j.jobStatus === 'Cancelled').length;
    setSuccessRate({ success: completed, failed });
    setJobStatusCounts({ completed, failed, printing, pending, cancelled });

    // Weekly stats (last 7 days) - hiển thị theo thứ tự thời gian
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    const weekStats: WeeklyStat[] = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayOfWeek = date.getDay(); // 0 = CN, 1 = T2, ..., 6 = T7
      const dayJobs = jobs.filter((job) => {
        const jobDate = new Date(job.submittedAt);
        return jobDate.toDateString() === date.toDateString();
      });
      weekStats.push({
        day: dayNames[dayOfWeek],
        success: dayJobs.filter((j) => j.jobStatus === 'Completed').length,
        failed: dayJobs.filter((j) => j.jobStatus === 'Failed').length,
      });
    }
    setWeeklyStats(weekStats);

    // Favorite printer - tìm máy in được sử dụng nhiều nhất
    const printerCount: Record<string, number> = {};
    jobs.forEach((job) => {
      const printer = job.printerName || `Máy in #${job.printerId}`;
      if (printer) {
        printerCount[printer] = (printerCount[printer] || 0) + 1;
      }
    });
    const topPrinter = Object.entries(printerCount).sort((a, b) => b[1] - a[1])[0];
    setFavoritePrinter(topPrinter ? topPrinter[0] : '--');
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

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
      case 'Cancelled': return '#6B7280';
      default: return '#6B7280';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Completed': return 'Hoàn thành';
      case 'Pending': return 'Đang chờ';
      case 'Printing': return 'Đang in';
      case 'Failed': return 'Thất bại';
      case 'Cancelled': return 'Đã hủy';
      default: return status;
    }
  };

  const maxBarValue = Math.max(...weeklyStats.map((s) => Math.max(s.success, s.failed)), 1);
  const totalJobs = successRate.success + successRate.failed;
  const hasData = totalJobs > 0;
  const successPercent = hasData ? Math.round((successRate.success / totalJobs) * 100) : 0;

  const recentJobs = printJobs.slice(0, 5);

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Đang tải dữ liệu...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Xin chào! 👋</Text>
          <Text style={styles.title}>Dashboard</Text>
        </View>
        <TouchableOpacity
          style={styles.notificationBtn}
          onPress={() => router.push('/(student)/notifications')}
        >
          <Ionicons name="notifications-outline" size={24} color="#374151" />
          {unreadCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Cards - Row 1: Tổng quan */}
        <View style={styles.statsGrid}>
          <TouchableOpacity
            style={[styles.statCard, { borderColor: '#DBEAFE' }]}
            onPress={() => router.push('/(student)/balance')}
          >
            <View style={[styles.statIcon, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="document-text" size={20} color="#3B82F6" />
            </View>
            <Text style={styles.statValue}>{balance?.pagesA4 ?? 0}</Text>
            <Text style={styles.statLabel}>Số dư trang A4</Text>
          </TouchableOpacity>

          <View style={[styles.statCard, { borderColor: '#E0E7FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#EEF2FF' }]}>
              <Ionicons name="trending-up" size={20} color="#6366F1" />
            </View>
            <Text style={[styles.statValue, { color: '#6366F1' }]}>{monthlyStats.jobs}</Text>
            <Text style={styles.statLabel}>Lệnh in tháng này</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#FED7AA' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FFF7ED' }]}>
              <Ionicons name="layers" size={20} color="#F97316" />
            </View>
            <Text style={[styles.statValue, { color: '#F97316' }]}>{monthlyStats.pages}</Text>
            <Text style={styles.statLabel}>Trang in tháng này</Text>
          </View>

          <View style={[styles.statCard, { borderColor: '#E9D5FF' }]}>
            <View style={[styles.statIcon, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="print" size={20} color="#A855F7" />
            </View>
            <Text style={[styles.statValue, styles.favoritePrinterText, { color: '#A855F7' }]} numberOfLines={1}>
              {favoritePrinter}
            </Text>
            <Text style={styles.statLabel}>Máy in yêu thích</Text>
          </View>
        </View>

        {/* Stats Cards - Row 2: Trạng thái lệnh in */}
        <Text style={styles.statusSectionTitle}>Trạng thái lệnh in</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusCardsScroll}>
          <View style={styles.statusCardsRow}>
            <View style={[styles.statusCard, { borderColor: '#D1FAE5' }]}>
              <View style={[styles.statusIcon, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="checkmark" size={18} color="#10B981" />
              </View>
              <Text style={[styles.statusValue, { color: '#10B981' }]}>{jobStatusCounts.completed}</Text>
              <Text style={styles.statusLabel}>Thành công</Text>
            </View>

            <View style={[styles.statusCard, { borderColor: '#FECACA' }]}>
              <View style={[styles.statusIcon, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="close" size={18} color="#EF4444" />
              </View>
              <Text style={[styles.statusValue, { color: '#EF4444' }]}>{jobStatusCounts.failed}</Text>
              <Text style={styles.statusLabel}>Thất bại</Text>
            </View>

            <View style={[styles.statusCard, { borderColor: '#DBEAFE' }]}>
              <View style={[styles.statusIcon, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="print" size={18} color="#3B82F6" />
              </View>
              <Text style={[styles.statusValue, { color: '#3B82F6' }]}>{jobStatusCounts.printing}</Text>
              <Text style={styles.statusLabel}>Đang in</Text>
            </View>

            <View style={[styles.statusCard, { borderColor: '#FEF3C7' }]}>
              <View style={[styles.statusIcon, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="time" size={18} color="#F59E0B" />
              </View>
              <Text style={[styles.statusValue, { color: '#F59E0B' }]}>{jobStatusCounts.pending}</Text>
              <Text style={styles.statusLabel}>Đang chờ</Text>
            </View>

            <View style={[styles.statusCard, { borderColor: '#E5E7EB' }]}>
              <View style={[styles.statusIcon, { backgroundColor: '#F3F4F6' }]}>
                <Ionicons name="ban" size={18} color="#6B7280" />
              </View>
              <Text style={[styles.statusValue, { color: '#6B7280' }]}>{jobStatusCounts.cancelled}</Text>
              <Text style={styles.statusLabel}>Đã hủy</Text>
            </View>
          </View>
        </ScrollView>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hành động nhanh</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#3B82F6' }]}
              onPress={() => router.push('/(student)/print/upload')}
            >
              <Ionicons name="cloud-upload" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Tải tài liệu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#10B981' }]}
              onPress={() => router.push('/(student)/print')}
            >
              <Ionicons name="print" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>In tài liệu</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: '#A855F7' }]}
              onPress={() => router.push('/(student)/balance/buy')}
            >
              <Ionicons name="cart" size={20} color="#fff" />
              <Text style={styles.actionBtnText}>Mua trang</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Weekly Stats Chart - Simple */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="bar-chart" size={18} color="#3B82F6" />
            <Text style={styles.sectionTitle}>Thống kê lệnh in theo tuần</Text>
          </View>
          <View style={styles.chartCard}>
            {/* Bars */}
            <View style={styles.chartContainer}>
              {weeklyStats.map((stat, index) => {
                const maxVal = Math.max(...weeklyStats.map((s) => Math.max(s.success, s.failed)), 1);
                const successHeight = stat.success > 0 ? (stat.success / maxVal) * 80 : 0;
                const failedHeight = stat.failed > 0 ? (stat.failed / maxVal) * 80 : 0;
                return (
                  <View key={index} style={styles.chartBar}>
                    <View style={styles.barGroup}>
                      {/* Success Bar with Label */}
                      <View style={styles.barWrapper}>
                        {stat.success > 0 && (
                          <Text style={styles.barValueSuccess}>{stat.success}</Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            styles.successBar,
                            { height: successHeight > 0 ? Math.max(successHeight, 6) : 0 },
                          ]}
                        />
                      </View>
                      {/* Failed Bar with Label */}
                      <View style={styles.barWrapper}>
                        {stat.failed > 0 && (
                          <Text style={styles.barValueFailed}>{stat.failed}</Text>
                        )}
                        <View
                          style={[
                            styles.bar,
                            styles.failedBar,
                            { height: failedHeight > 0 ? Math.max(failedHeight, 6) : 0 },
                          ]}
                        />
                      </View>
                    </View>
                    <Text style={styles.chartLabel}>{stat.day}</Text>
                  </View>
                );
              })}
            </View>
            <View style={styles.chartLegend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#10B981' }]} />
                <Text style={styles.legendText}>Thành công</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: '#F87171' }]} />
                <Text style={styles.legendText}>Thất bại</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Success Rate */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pie-chart" size={18} color="#10B981" />
            <Text style={styles.sectionTitle}>Tỷ lệ thành công</Text>
          </View>
          <View style={styles.successRateCard}>
            <View style={styles.successRateCircle}>
              <Text style={styles.successRatePercent}>{successPercent}%</Text>
              <Text style={styles.successRateLabel}>Thành công</Text>
            </View>
            <View style={styles.successRateStats}>
              <View style={styles.successRateStat}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.successRateValue}>{successRate.success}</Text>
                <Text style={styles.successRateStatLabel}>Thành công</Text>
              </View>
              <View style={styles.successRateStat}>
                <Ionicons name="close-circle" size={20} color="#EF4444" />
                <Text style={styles.successRateValue}>{successRate.failed}</Text>
                <Text style={styles.successRateStatLabel}>Thất bại</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Recent Print Jobs */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <View style={styles.sectionHeader}>
              <Ionicons name="flash" size={18} color="#A855F7" />
              <Text style={styles.sectionTitle}>Hoạt động gần đây</Text>
            </View>
            <TouchableOpacity onPress={() => router.push('/(student)/print/history')}>
              <Text style={styles.seeAll}>Xem chi tiết →</Text>
            </TouchableOpacity>
          </View>

          {recentJobs.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có hoạt động nào</Text>
            </View>
          ) : (
            recentJobs.map((job) => (
              <TouchableOpacity
                key={job.jobId}
                style={styles.jobCard}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/print/history/[id]',
                    params: { id: job.jobId.toString() },
                  })
                }
              >
                <View style={styles.jobIcon}>
                  <Ionicons name="document-text" size={20} color="#6B7280" />
                </View>
                <View style={styles.jobInfo}>
                  <Text style={styles.jobName} numberOfLines={1}>
                    {job.documentName || `Tài liệu #${job.documentId}`}
                  </Text>
                  <Text style={styles.jobMeta}>
                    {job.printerName || job.printerId} • {new Date(job.submittedAt).toLocaleDateString('vi-VN')}
                  </Text>
                </View>
                <View style={[styles.jobStatus, { backgroundColor: getStatusColor(job.jobStatus) + '20' }]}>
                  <Text style={[styles.jobStatusText, { color: getStatusColor(job.jobStatus) }]}>
                    {getStatusText(job.jobStatus)}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontSize: 16, color: '#6B7280' },
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
  notificationBtn: { padding: 8, position: 'relative' },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  content: { flex: 1, padding: 16 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 16 },
  statCard: {
    width: (width - 44) / 2,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  favoritePrinterText: { fontSize: 14 },
  // Status cards section
  statusSectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 10,
    marginTop: 4,
  },
  statusCardsScroll: { marginBottom: 20 },
  statusCardsRow: { flexDirection: 'row', gap: 10, paddingRight: 16 },
  statusCard: {
    width: 90,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statusValue: { fontSize: 20, fontWeight: 'bold' },
  statusLabel: { fontSize: 10, color: '#6B7280', marginTop: 2, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  actionsRow: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 6,
  },
  actionBtnText: { fontSize: 13, fontWeight: '600', color: '#fff' },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    height: 110,
    alignItems: 'flex-end',
    paddingTop: 10,
  },
  chartBar: { alignItems: 'center', flex: 1 },
  barGroup: { flexDirection: 'row', alignItems: 'flex-end', height: 90, gap: 3 },
  barWrapper: { alignItems: 'center' },
  bar: { width: 14, borderRadius: 4, minHeight: 0 },
  successBar: { backgroundColor: '#10B981' },
  failedBar: { backgroundColor: '#F87171' },
  barValueSuccess: { fontSize: 9, color: '#10B981', fontWeight: '700', marginBottom: 2 },
  barValueFailed: { fontSize: 9, color: '#EF4444', fontWeight: '700', marginBottom: 2 },
  chartLabel: { fontSize: 11, color: '#6B7280', marginTop: 8, fontWeight: '500' },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontSize: 12, color: '#6B7280' },
  successRateCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    flexDirection: 'row',
    alignItems: 'center',
  },
  successRateCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#10B981',
  },
  successRatePercent: { fontSize: 24, fontWeight: 'bold', color: '#10B981' },
  successRateLabel: { fontSize: 10, color: '#6B7280' },
  successRateStats: { flex: 1, marginLeft: 20, gap: 12 },
  successRateStat: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  successRateValue: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  successRateStatLabel: { fontSize: 12, color: '#6B7280' },
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
