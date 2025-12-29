import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { spsoService, MonthlyReport, YearlyReport } from '../../services/spsoService';

type ReportType = 'monthly' | 'yearly';

export default function ReportsScreen() {
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [monthlyReport, setMonthlyReport] = useState<MonthlyReport | null>(null);
  const [yearlyReport, setYearlyReport] = useState<YearlyReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const years = Array.from({ length: 6 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'T1' }, { value: 2, label: 'T2' }, { value: 3, label: 'T3' },
    { value: 4, label: 'T4' }, { value: 5, label: 'T5' }, { value: 6, label: 'T6' },
    { value: 7, label: 'T7' }, { value: 8, label: 'T8' }, { value: 9, label: 'T9' },
    { value: 10, label: 'T10' }, { value: 11, label: 'T11' }, { value: 12, label: 'T12' },
  ];

  useEffect(() => {
    loadReport();
  }, [reportType, selectedYear, selectedMonth]);

  const loadReport = async () => {
    setLoading(true);
    setError('');
    try {
      if (reportType === 'monthly') {
        const data = await spsoService.getMonthlyReport(selectedYear, selectedMonth);
        setMonthlyReport(data);
        setYearlyReport(null);
      } else {
        const data = await spsoService.getYearlyReport(selectedYear);
        setYearlyReport(data);
        setMonthlyReport(null);
      }
    } catch (err: any) {
      setError(err.message || 'Không thể tải báo cáo');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const formatPercent = (value: number) => `${value.toFixed(1)}%`;

  const renderMonthlyReport = () => {
    if (!monthlyReport) return null;
    const successRate = monthlyReport.totalPrintJobs > 0
      ? ((monthlyReport.successfulJobs / monthlyReport.totalPrintJobs) * 100).toFixed(1)
      : '0';

    return (
      <ScrollView style={styles.reportContent}>
        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="print" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{monthlyReport.totalPrintJobs}</Text>
              <Text style={styles.statLabel}>Tổng lệnh in</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={styles.statValue}>{monthlyReport.successfulJobs}</Text>
              <Text style={styles.statLabel}>Thành công</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.statValue}>{monthlyReport.failedJobs}</Text>
              <Text style={styles.statLabel}>Thất bại</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="document-text" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{monthlyReport.totalPagesPrinted}</Text>
              <Text style={styles.statLabel}>Tổng trang</Text>
            </View>
          </View>
        </View>

        {/* Revenue */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={24} color="#fff" />
            <Text style={styles.revenueLabel}>Doanh thu</Text>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(monthlyReport.totalRevenue)}</Text>
          <Text style={styles.revenueSubtext}>
            {monthlyReport.totalPagesPurchased} trang đã mua • {monthlyReport.totalStudentsActive} SV hoạt động
          </Text>
        </View>

        {/* Paper Distribution */}
        {monthlyReport.paperSizeDistribution && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Phân bổ khổ giấy</Text>
            <View style={styles.distributionCard}>
              <View style={styles.distributionRow}>
                <View style={styles.distributionItem}>
                  <Text style={styles.distributionLabel}>A4</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${monthlyReport.paperSizeDistribution.a4Percentage}%`, backgroundColor: '#3B82F6' }]} />
                  </View>
                  <Text style={styles.distributionValue}>
                    {formatPercent(monthlyReport.paperSizeDistribution.a4Percentage)} ({monthlyReport.paperSizeDistribution.a4Count})
                  </Text>
                </View>
                <View style={styles.distributionItem}>
                  <Text style={styles.distributionLabel}>A3</Text>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${monthlyReport.paperSizeDistribution.a3Percentage}%`, backgroundColor: '#22C55E' }]} />
                  </View>
                  <Text style={styles.distributionValue}>
                    {formatPercent(monthlyReport.paperSizeDistribution.a3Percentage)} ({monthlyReport.paperSizeDistribution.a3Count})
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Top Students */}
        {monthlyReport.topStudents && monthlyReport.topStudents.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top sinh viên in nhiều</Text>
            {monthlyReport.topStudents.slice(0, 5).map((student, index) => (
              <View key={student.studentId} style={styles.rankItem}>
                <View style={[styles.rankBadge, { backgroundColor: index === 0 ? '#FCD34D' : index === 1 ? '#D1D5DB' : index === 2 ? '#FDBA74' : '#E5E7EB' }]}>
                  <Text style={styles.rankNumber}>{index + 1}</Text>
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{student.studentName}</Text>
                  <Text style={styles.rankSub}>{student.studentId}</Text>
                </View>
                <View style={styles.rankStats}>
                  <Text style={styles.rankValue}>{student.totalPages} trang</Text>
                  <Text style={styles.rankSub}>{student.totalJobs} lệnh</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Top Printers */}
        {monthlyReport.topPrinters && monthlyReport.topPrinters.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top máy in bận nhất</Text>
            {monthlyReport.topPrinters.slice(0, 3).map((printer, index) => (
              <View key={printer.printerId} style={styles.rankItem}>
                <View style={[styles.rankBadge, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="print" size={16} color="#3B82F6" />
                </View>
                <View style={styles.rankInfo}>
                  <Text style={styles.rankName}>{printer.printerName}</Text>
                  <Text style={styles.rankSub}>{printer.location}</Text>
                </View>
                <View style={styles.rankStats}>
                  <Text style={styles.rankValue}>{printer.totalJobs} lệnh</Text>
                  <Text style={styles.rankSub}>{printer.totalPages} trang</Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Success Rate */}
        <View style={styles.insightCard}>
          <Ionicons name="analytics" size={24} color="#7C3AED" />
          <View style={styles.insightContent}>
            <Text style={styles.insightTitle}>Tỷ lệ thành công</Text>
            <Text style={styles.insightValue}>{successRate}%</Text>
          </View>
        </View>
      </ScrollView>
    );
  };

  const renderYearlyReport = () => {
    if (!yearlyReport) return null;

    return (
      <ScrollView style={styles.reportContent}>
        {/* Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tổng quan năm {yearlyReport.year}</Text>
          <View style={styles.statsGrid}>
            <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="print" size={24} color="#3B82F6" />
              <Text style={styles.statValue}>{yearlyReport.totalPrintJobs}</Text>
              <Text style={styles.statLabel}>Tổng lệnh in</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F0FDF4' }]}>
              <Ionicons name="checkmark-circle" size={24} color="#22C55E" />
              <Text style={styles.statValue}>{yearlyReport.successfulJobs}</Text>
              <Text style={styles.statLabel}>Thành công</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#FEF2F2' }]}>
              <Ionicons name="close-circle" size={24} color="#EF4444" />
              <Text style={styles.statValue}>{yearlyReport.failedJobs}</Text>
              <Text style={styles.statLabel}>Thất bại</Text>
            </View>
            <View style={[styles.statCard, { backgroundColor: '#F5F3FF' }]}>
              <Ionicons name="people" size={24} color="#8B5CF6" />
              <Text style={styles.statValue}>{yearlyReport.totalStudentsActive}</Text>
              <Text style={styles.statLabel}>SV hoạt động</Text>
            </View>
          </View>
        </View>

        {/* Revenue */}
        <View style={styles.revenueCard}>
          <View style={styles.revenueHeader}>
            <Ionicons name="cash" size={24} color="#fff" />
            <Text style={styles.revenueLabel}>Tổng doanh thu năm</Text>
          </View>
          <Text style={styles.revenueValue}>{formatCurrency(yearlyReport.totalRevenue)}</Text>
          <Text style={styles.revenueSubtext}>{yearlyReport.totalPagesPrinted} trang đã in</Text>
        </View>

        {/* Monthly Stats */}
        {yearlyReport.monthlyStats && yearlyReport.monthlyStats.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Thống kê theo tháng</Text>
            {yearlyReport.monthlyStats.map((month) => (
              <View key={month.month} style={styles.monthItem}>
                <Text style={styles.monthName}>{month.monthName}</Text>
                <View style={styles.monthStats}>
                  <Text style={styles.monthValue}>{month.jobs} lệnh</Text>
                  <Text style={styles.monthSub}>{month.pages} trang</Text>
                  <Text style={styles.monthRevenue}>{formatCurrency(month.revenue)}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Báo cáo thống kê</Text>
      </View>

      {/* Filters */}
      <View style={styles.filterContainer}>
        {/* Report Type */}
        <View style={styles.typeToggle}>
          <TouchableOpacity
            style={[styles.typeBtn, reportType === 'monthly' && styles.typeBtnActive]}
            onPress={() => setReportType('monthly')}
          >
            <Text style={[styles.typeText, reportType === 'monthly' && styles.typeTextActive]}>Tháng</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeBtn, reportType === 'yearly' && styles.typeBtnActive]}
            onPress={() => setReportType('yearly')}
          >
            <Text style={[styles.typeText, reportType === 'yearly' && styles.typeTextActive]}>Năm</Text>
          </TouchableOpacity>
        </View>

        {/* Year Selector */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.yearSelector}>
          {years.map((year) => (
            <TouchableOpacity
              key={year}
              style={[styles.yearItem, selectedYear === year && styles.yearItemActive]}
              onPress={() => setSelectedYear(year)}
            >
              <Text style={[styles.yearText, selectedYear === year && styles.yearTextActive]}>{year}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Month Selector (only for monthly) */}
        {reportType === 'monthly' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.monthSelector}>
            {months.map((m) => (
              <TouchableOpacity
                key={m.value}
                style={[styles.monthBtn, selectedMonth === m.value && styles.monthBtnActive]}
                onPress={() => setSelectedMonth(m.value)}
              >
                <Text style={[styles.monthText, selectedMonth === m.value && styles.monthTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
          <Text style={styles.loadingText}>Đang tải báo cáo...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color="#EF4444" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={loadReport}>
            <Text style={styles.retryText}>Thử lại</Text>
          </TouchableOpacity>
        </View>
      ) : reportType === 'monthly' ? (
        renderMonthlyReport()
      ) : (
        renderYearlyReport()
      )}
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
  filterContainer: { backgroundColor: '#fff', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  typeToggle: { flexDirection: 'row', backgroundColor: '#F3F4F6', borderRadius: 8, padding: 4 },
  typeBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 6 },
  typeBtnActive: { backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2, elevation: 2 },
  typeText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  typeTextActive: { color: '#7C3AED', fontWeight: '600' },
  yearSelector: { marginTop: 12 },
  yearItem: { paddingHorizontal: 16, paddingVertical: 8, backgroundColor: '#F3F4F6', borderRadius: 8, marginRight: 8 },
  yearItemActive: { backgroundColor: '#7C3AED' },
  yearText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  yearTextActive: { color: '#fff' },
  monthSelector: { marginTop: 10 },
  monthBtn: { paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#F3F4F6', borderRadius: 16, marginRight: 6 },
  monthBtnActive: { backgroundColor: '#7C3AED' },
  monthText: { fontSize: 13, color: '#374151' },
  monthTextActive: { color: '#fff', fontWeight: '600' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, color: '#6B7280' },
  errorContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  errorText: { marginTop: 12, color: '#EF4444', textAlign: 'center' },
  retryBtn: { marginTop: 16, paddingHorizontal: 24, paddingVertical: 10, backgroundColor: '#7C3AED', borderRadius: 8 },
  retryText: { color: '#fff', fontWeight: '600' },
  reportContent: { flex: 1, padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { width: '48%', borderRadius: 12, padding: 14, alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  revenueCard: { backgroundColor: '#7C3AED', borderRadius: 16, padding: 20, marginBottom: 20 },
  revenueHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  revenueLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  revenueValue: { fontSize: 32, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  revenueSubtext: { fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  distributionCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  distributionRow: { gap: 16 },
  distributionItem: { marginBottom: 12 },
  distributionLabel: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 6 },
  progressBar: { height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  distributionValue: { fontSize: 12, color: '#6B7280', marginTop: 4 },
  rankItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  rankBadge: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  rankNumber: { fontSize: 14, fontWeight: 'bold', color: '#374151' },
  rankInfo: { flex: 1, marginLeft: 12 },
  rankName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  rankSub: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  rankStats: { alignItems: 'flex-end' },
  rankValue: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  insightCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F5F3FF', borderRadius: 12, padding: 16, marginBottom: 20 },
  insightContent: { marginLeft: 12 },
  insightTitle: { fontSize: 13, color: '#6B7280' },
  insightValue: { fontSize: 24, fontWeight: 'bold', color: '#7C3AED' },
  monthItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#fff', borderRadius: 10, padding: 12, marginBottom: 8, borderWidth: 1, borderColor: '#E5E7EB' },
  monthName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  monthStats: { alignItems: 'flex-end' },
  monthValue: { fontSize: 13, fontWeight: '500', color: '#374151' },
  monthSub: { fontSize: 11, color: '#6B7280' },
  monthRevenue: { fontSize: 12, fontWeight: '600', color: '#059669', marginTop: 2 },
});
