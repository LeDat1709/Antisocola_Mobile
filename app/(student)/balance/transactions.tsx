import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pageBalanceService, PageTransaction } from '../../../services/pageBalanceService';

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<PageTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadTransactions = async (pageNum: number = 0) => {
    try {
      const data = await pageBalanceService.getTransactions(pageNum, 20);
      if (pageNum === 0) {
        setTransactions(data.content);
      } else {
        setTransactions((prev) => [...prev, ...data.content]);
      }
      setHasMore(data.currentPage < data.totalPages - 1);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      loadTransactions(nextPage);
    }
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'ALLOCATED': return { icon: 'gift', color: '#10B981', label: 'Cấp phát' };
      case 'PURCHASED': return { icon: 'card', color: '#3B82F6', label: 'Mua' };
      case 'DEDUCTED': return { icon: 'print', color: '#EF4444', label: 'Sử dụng' };
      default: return { icon: 'swap-horizontal', color: '#6B7280', label: type };
    }
  };

  const renderItem = ({ item }: { item: PageTransaction }) => {
    const typeInfo = getTypeInfo(item.transactionType);
    return (
      <View style={styles.txCard}>
        <View style={[styles.txIcon, { backgroundColor: typeInfo.color + '20' }]}>
          <Ionicons name={typeInfo.icon as any} size={20} color={typeInfo.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txCode}>{item.transactionCode}</Text>
          <Text style={styles.txType}>{typeInfo.label}</Text>
          <Text style={styles.txDate}>
            {new Date(item.createdAt).toLocaleString('vi-VN')}
          </Text>
          {item.notes && <Text style={styles.txNotes}>{item.notes}</Text>}
        </View>
        <View style={styles.txRight}>
          <Text style={[styles.txAmount, { color: item.a4Pages > 0 ? '#10B981' : '#EF4444' }]}>
            {item.a4Pages > 0 ? '+' : ''}{item.a4Pages}
          </Text>
          <Text style={styles.txBalance}>Còn: {item.balanceAfterA4}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Lịch sử giao dịch</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading && transactions.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
        </View>
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderItem}
          keyExtractor={(item) => item.transactionId.toString()}
          contentContainerStyle={styles.list}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có giao dịch nào</Text>
            </View>
          }
          ListFooterComponent={
            loading && transactions.length > 0 ? (
              <ActivityIndicator style={{ padding: 16 }} color="#3B82F6" />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
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
  title: { fontSize: 18, fontWeight: '600', color: '#111827' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 16 },
  txCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: { flex: 1, marginLeft: 12 },
  txCode: { fontSize: 14, fontWeight: '600', color: '#111827' },
  txType: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txDate: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  txNotes: { fontSize: 11, color: '#6B7280', marginTop: 4, fontStyle: 'italic' },
  txRight: { alignItems: 'flex-end' },
  txAmount: { fontSize: 18, fontWeight: '700' },
  txBalance: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
