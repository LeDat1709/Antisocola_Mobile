import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { printerService, Printer } from '../../../services/printerService';

export default function PrinterListScreen() {
  const router = useRouter();
  const { documentId, documentIds } = useLocalSearchParams<{ documentId?: string; documentIds?: string }>();
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCampus, setSelectedCampus] = useState<string | undefined>();

  // Check if we're in selection mode
  const isSelectionMode = !!documentId || !!documentIds;

  const loadPrinters = async () => {
    try {
      const data = await printerService.getPrinters({ campus: selectedCampus, status: 'Active' });
      setPrinters(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadPrinters();
  }, [selectedCampus]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Inactive': return '#6B7280';
      case 'Maintenance': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const renderPrinter = ({ item }: { item: Printer }) => (
    <TouchableOpacity
      style={styles.printerCard}
      onPress={() => {
        const params: any = { id: item.printerId };
        if (documentIds) params.documentIds = documentIds;
        else if (documentId) params.documentId = documentId;
        router.push({ pathname: `/(student)/printers/${item.printerId}`, params });
      }}
    >
      <View style={styles.printerIcon}>
        <Ionicons name="print" size={24} color="#3B82F6" />
      </View>
      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{item.printerName}</Text>
        <Text style={styles.printerLocation}>
          <Ionicons name="location-outline" size={12} color="#6B7280" /> {item.location}
        </Text>
        <View style={styles.printerFeatures}>
          {item.colorPrinting && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>Màu</Text>
            </View>
          )}
          {item.duplexPrinting && (
            <View style={styles.featureBadge}>
              <Text style={styles.featureText}>2 mặt</Text>
            </View>
          )}
          <View style={styles.featureBadge}>
            <Text style={styles.featureText}>{item.paperSizes}</Text>
          </View>
        </View>
      </View>
      <View style={styles.printerRight}>
        <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
        <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
      </View>
    </TouchableOpacity>
  );

  const campuses = printerService.getAvailableCampuses();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        {isSelectionMode && (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>
        )}
        <Text style={styles.title}>{isSelectionMode ? 'Chọn máy in' : 'Máy in'}</Text>
      </View>

      {/* Campus Filter */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterBtn, !selectedCampus && styles.filterBtnActive]}
          onPress={() => setSelectedCampus(undefined)}
        >
          <Text style={[styles.filterText, !selectedCampus && styles.filterTextActive]}>Tất cả</Text>
        </TouchableOpacity>
        {campuses.map((campus) => (
          <TouchableOpacity
            key={campus}
            style={[styles.filterBtn, selectedCampus === campus && styles.filterBtnActive]}
            onPress={() => setSelectedCampus(campus)}
          >
            <Text style={[styles.filterText, selectedCampus === campus && styles.filterTextActive]}>
              {campus}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={printers}
        renderItem={renderPrinter}
        keyExtractor={(item) => item.printerId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadPrinters(); }} />
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="print-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy máy in</Text>
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
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  filterRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
  },
  filterBtnActive: { backgroundColor: '#3B82F6' },
  filterText: { fontSize: 13, fontWeight: '500', color: '#6B7280' },
  filterTextActive: { color: '#fff' },
  list: { padding: 16 },
  printerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  printerIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printerInfo: { flex: 1, marginLeft: 12 },
  printerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  printerLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  printerFeatures: { flexDirection: 'row', gap: 6, marginTop: 6 },
  featureBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  featureText: { fontSize: 10, color: '#6B7280', fontWeight: '500' },
  printerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
