import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { printJobService, PrintJob } from '../../../../services/printJobService';

export default function PrintDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [job, setJob] = useState<PrintJob | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadJob = async () => {
      try {
        const jobs = await printJobService.getMyPrintJobs();
        const found = jobs.find((j) => j.jobId === parseInt(id));
        setJob(found || null);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadJob();
  }, [id]);

  const handleCancel = async () => {
    if (!job) return;

    Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy lệnh in này?', [
      { text: 'Không' },
      {
        text: 'Hủy lệnh',
        style: 'destructive',
        onPress: async () => {
          try {
            await printJobService.cancelPrintJob(job.jobId);
            Alert.alert('Thành công', 'Đã hủy lệnh in');
            router.back();
          } catch (error) {
            Alert.alert('Lỗi', (error as Error).message);
          }
        },
      },
    ]);
  };

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

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!job) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết lệnh in</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Không tìm thấy lệnh in</Text>
        </View>
      </SafeAreaView>
    );
  }

  const statusInfo = getStatusInfo(job.jobStatus);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết lệnh in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Status Card */}
        <View style={[styles.statusCard, { backgroundColor: statusInfo.color + '10' }]}>
          <Ionicons name={statusInfo.icon as any} size={32} color={statusInfo.color} />
          <Text style={[styles.statusLabel, { color: statusInfo.color }]}>{statusInfo.label}</Text>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài liệu</Text>
          <View style={styles.infoCard}>
            <DetailRow icon="document-text" label="Tên file" value={job.documentName || `#${job.documentId}`} />
            <DetailRow icon="layers" label="Số trang" value={`${job.totalPagesToPrint} trang`} />
            <DetailRow icon="copy" label="Số bản" value={job.numCopies.toString()} />
          </View>
        </View>

        {/* Print Config */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cấu hình in</Text>
          <View style={styles.infoCard}>
            <DetailRow icon="resize" label="Khổ giấy" value={job.paperSize} />
            <DetailRow icon="albums" label="In 2 mặt" value={job.duplex ? 'Có' : 'Không'} />
            <DetailRow icon="color-palette" label="Màu sắc" value={job.colorMode === 'Color' ? 'Màu' : 'Đen trắng'} />
            <DetailRow icon="calculator" label="Trang A4 tương đương" value={`${job.a4EquivalentPages} trang`} />
          </View>
        </View>

        {/* Printer Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Máy in</Text>
          <View style={styles.infoCard}>
            <DetailRow icon="print" label="Tên máy" value={job.printerName || `#${job.printerId}`} />
          </View>
        </View>

        {/* Timeline */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thời gian</Text>
          <View style={styles.infoCard}>
            <DetailRow icon="time" label="Gửi lệnh" value={new Date(job.submittedAt).toLocaleString('vi-VN')} />
            {job.completedAt && (
              <DetailRow icon="checkmark" label="Hoàn thành" value={new Date(job.completedAt).toLocaleString('vi-VN')} />
            )}
          </View>
        </View>

        {/* Error Message */}
        {job.errorMessage && (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={20} color="#EF4444" />
            <Text style={styles.errorText}>{job.errorMessage}</Text>
          </View>
        )}

        {/* Cancel Button */}
        {job.jobStatus === 'Pending' && (
          <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.cancelBtnText}>Hủy lệnh in</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon as any} size={18} color="#6B7280" />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
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
  content: { flex: 1, padding: 16 },
  statusCard: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
  },
  statusLabel: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  detailLabel: { fontSize: 14, color: '#6B7280' },
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827', maxWidth: '50%', textAlign: 'right' },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: '#DC2626', flex: 1 },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
