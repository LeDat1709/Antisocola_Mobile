import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { printerService, Printer } from '../../../services/printerService';

export default function PrinterDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrinter = async () => {
      try {
        const data = await printerService.getPrinterById(parseInt(id));
        setPrinter(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    if (id) loadPrinter();
  }, [id]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Inactive': return '#6B7280';
      case 'Maintenance': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'Active': return 'Hoạt động';
      case 'Inactive': return 'Không hoạt động';
      case 'Maintenance': return 'Bảo trì';
      case 'OutOfPaper': return 'Hết giấy';
      case 'OutOfToner': return 'Hết mực';
      default: return status;
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

  if (!printer) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chi tiết máy in</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>Không tìm thấy máy in</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chi tiết máy in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Printer Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.printerIcon}>
            <Ionicons name="print" size={32} color="#3B82F6" />
          </View>
          <Text style={styles.printerName}>{printer.printerName}</Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(printer.status) + '20' }]}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(printer.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(printer.status) }]}>
              {getStatusLabel(printer.status)}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin</Text>
          <View style={styles.detailCard}>
            <DetailRow icon="business" label="Thương hiệu" value={printer.brand} />
            <DetailRow icon="hardware-chip" label="Model" value={printer.model} />
            <DetailRow icon="location" label="Vị trí" value={printer.location} />
            <DetailRow icon="layers" label="Khổ giấy" value={printer.paperSizes} />
          </View>
        </View>

        {/* Features */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tính năng</Text>
          <View style={styles.featuresRow}>
            <View style={[styles.featureCard, printer.colorPrinting && styles.featureActive]}>
              <Ionicons
                name="color-palette"
                size={24}
                color={printer.colorPrinting ? '#3B82F6' : '#D1D5DB'}
              />
              <Text style={[styles.featureLabel, printer.colorPrinting && styles.featureLabelActive]}>
                In màu
              </Text>
            </View>
            <View style={[styles.featureCard, printer.duplexPrinting && styles.featureActive]}>
              <Ionicons
                name="copy"
                size={24}
                color={printer.duplexPrinting ? '#3B82F6' : '#D1D5DB'}
              />
              <Text style={[styles.featureLabel, printer.duplexPrinting && styles.featureLabelActive]}>
                In 2 mặt
              </Text>
            </View>
          </View>
        </View>

        {/* Select Button */}
        {printer.status === 'Active' && (
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => router.push({ pathname: '/(student)/print/upload', params: { printerId: printer.printerId } })}
          >
            <Ionicons name="checkmark-circle" size={20} color="#fff" />
            <Text style={styles.selectBtnText}>Chọn máy in này</Text>
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
      <Text style={styles.detailValue}>{value}</Text>
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
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  printerIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  printerName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginBottom: 8 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#374151', marginBottom: 10 },
  detailCard: {
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
  detailValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  featuresRow: { flexDirection: 'row', gap: 12 },
  featureCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  featureActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  featureLabel: { fontSize: 13, color: '#9CA3AF', marginTop: 8 },
  featureLabelActive: { color: '#3B82F6', fontWeight: '500' },
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  selectBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyText: { fontSize: 14, color: '#9CA3AF' },
});
