import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pageBalanceService, PageBalance, PageTransaction } from '../../../services/pageBalanceService';

export default function PageBalanceScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<PageBalance | null>(null);
  const [transactions, setTransactions] = useState<PageTransaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [balanceData, txData] = await Promise.all([
        pageBalanceService.getBalance(),
        pageBalanceService.getTransactions(0, 5),
      ]);
      setBalance(balanceData);
      setTransactions(txData.content);
    } catch (error) {
      console.error(error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'ALLOCATED': return { icon: 'gift', color: '#10B981' };
      case 'PURCHASED': return { icon: 'card', color: '#3B82F6' };
      case 'DEDUCTED': return { icon: 'print', color: '#EF4444' };
      default: return { icon: 'swap-horizontal', color: '#6B7280' };
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Số dư trang</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadData} />}
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <Ionicons name="wallet" size={28} color="#fff" />
            <Text style={styles.balanceLabel}>Số dư hiện tại</Text>
          </View>
          <Text style={styles.balanceValue}>{balance?.pagesA4 ?? '--'}</Text>
          <Text style={styles.balanceUnit}>trang A4</Text>
        </View>

        {/* Actions */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(student)/balance/buy')}
          >
            <Ionicons name="add-circle" size={20} color="#3B82F6" />
            <Text style={styles.actionBtnText}>Mua thêm</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/(student)/balance/transactions')}
          >
            <Ionicons name="list" size={20} color="#3B82F6" />
            <Text style={styles.actionBtnText}>Lịch sử</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Giao dịch gần đây</Text>
            <TouchableOpacity onPress={() => router.push('/(student)/balance/transactions')}>
              <Text style={styles.seeAll}>Xem tất cả</Text>
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>Chưa có giao dịch</Text>
            </View>
          ) : (
            transactions.map((tx) => {
              const typeInfo = getTypeIcon(tx.transactionType);
              return (
                <View key={tx.transactionId} style={styles.txCard}>
                  <View style={[styles.txIcon, { backgroundColor: typeInfo.color + '20' }]}>
                    <Ionicons name={typeInfo.icon as any} size={18} color={typeInfo.color} />
                  </View>
                  <View style={styles.txInfo}>
                    <Text style={styles.txCode}>{tx.transactionCode}</Text>
                    <Text style={styles.txDate}>
                      {new Date(tx.createdAt).toLocaleDateString('vi-VN')}
                    </Text>
                  </View>
                  <Text style={[styles.txAmount, { color: tx.a4Pages > 0 ? '#10B981' : '#EF4444' }]}>
                    {tx.a4Pages > 0 ? '+' : ''}{tx.a4Pages}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 16 },
  balanceCard: {
    backgroundColor: '#3B82F6',
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
  },
  balanceHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  balanceLabel: { fontSize: 14, color: 'rgba(255,255,255,0.8)' },
  balanceValue: { fontSize: 56, fontWeight: 'bold', color: '#fff', marginTop: 8 },
  balanceUnit: { fontSize: 16, color: 'rgba(255,255,255,0.8)' },
  actionsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  actionBtnText: { fontSize: 14, fontWeight: '600', color: '#3B82F6' },
  section: { marginBottom: 20 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#111827', marginBottom: 12 },
  seeAll: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  emptyState: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 8 },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txInfo: { flex: 1, marginLeft: 12 },
  txCode: { fontSize: 14, fontWeight: '500', color: '#111827' },
  txDate: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: '700' },
});
