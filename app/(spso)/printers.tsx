import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { printerService, Printer } from '../../services/printerService';

export default function SPSOPrintersScreen() {
  const [printers, setPrinters] = useState<Printer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadPrinters = async () => {
    try {
      const data = await printerService.getPrinters({}, 0, 50);
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
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return '#10B981';
      case 'Inactive': return '#6B7280';
      case 'Maintenance': return '#F59E0B';
      default: return '#EF4444';
    }
  };

  const renderPrinter = ({ item }: { item: Printer }) => (
    <View style={styles.printerCard}>
      <View style={styles.printerIcon}>
        <Ionicons name="print" size={24} color="#7C3AED" />
      </View>
      <View style={styles.printerInfo}>
        <Text style={styles.printerName}>{item.printerName}</Text>
        <Text style={styles.printerLocation}>{item.location}</Text>
        <View style={styles.printerMeta}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor(item.status) }]} />
          <Text style={styles.statusLabel}>{item.status}</Text>
          <Text style={styles.metaSeparator}>•</Text>
          <Text style={styles.metaText}>{item.paperSizes}</Text>
          {item.colorPrinting && (
            <>
              <Text style={styles.metaSeparator}>•</Text>
              <Text style={styles.metaText}>Màu</Text>
            </>
          )}
        </View>
      </View>
      <TouchableOpacity style={styles.moreBtn}>
        <Ionicons name="ellipsis-vertical" size={20} color="#9CA3AF" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý máy in</Text>
        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={printers}
        renderItem={renderPrinter}
        keyExtractor={(item) => item.printerId.toString()}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadPrinters} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="print-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có máy in nào</Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center' },
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
  printerIcon: { width: 48, height: 48, borderRadius: 12, backgroundColor: '#F3E8FF', justifyContent: 'center', alignItems: 'center' },
  printerInfo: { flex: 1, marginLeft: 12 },
  printerName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  printerLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  printerMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusLabel: { fontSize: 11, color: '#6B7280', marginLeft: 4 },
  metaSeparator: { fontSize: 11, color: '#D1D5DB', marginHorizontal: 6 },
  metaText: { fontSize: 11, color: '#6B7280' },
  moreBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
