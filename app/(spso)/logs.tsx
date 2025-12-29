import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spsoService, PrintLog } from '../../services/spsoService';

export default function PrintLogsScreen() {
  const [logs, setLogs] = useState<PrintLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadLogs = async () => {
    try {
      const data = await spsoService.getPrintLogs(0, 50);
      setLogs(data.content);
    } catch (e) { console.error(e); }
    finally { setRefreshing(false); }
  };

  useEffect(() => { loadLogs(); }, []);

  const getStatusInfo = (s: string) => {
    if (s === 'Completed') return { color: '#10B981', bg: '#D1FAE5' };
    if (s === 'Failed') return { color: '#EF4444', bg: '#FEE2E2' };
    return { color: '#F59E0B', bg: '#FEF3C7' };
  };

  const renderLog = ({ item }: { item: PrintLog }) => {
    const st = getStatusInfo(item.status);
    return (
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.id}>#{item.logId}</Text>
          <View style={[styles.badge, { backgroundColor: st.bg }]}>
            <Text style={[styles.badgeText, { color: st.color }]}>{item.status}</Text>
          </View>
        </View>
        <Text style={styles.doc} numberOfLines={1}>{item.documentName}</Text>
        <Text style={styles.meta}>{item.studentName} • {item.printerName}</Text>
        <Text style={styles.time}>{item.pagesPrinted} trang • {new Date(item.printTime).toLocaleString('vi-VN')}</Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}><Text style={styles.title}>Nhật ký in</Text></View>
      <FlatList
        data={logs}
        renderItem={renderLog}
        keyExtractor={(i) => i.logId.toString()}
        contentContainerStyle={{ padding: 16 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadLogs} />}
        ListEmptyComponent={<View style={styles.empty}><Ionicons name="document-text-outline" size={48} color="#D1D5DB" /><Text style={styles.emptyText}>Chưa có nhật ký</Text></View>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E5E7EB' },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  id: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  badge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  badgeText: { fontSize: 10, fontWeight: '600' },
  doc: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 4 },
  meta: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  time: { fontSize: 11, color: '#9CA3AF' },
  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
