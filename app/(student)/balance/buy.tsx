import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { pageBalanceService } from '../../../services/pageBalanceService';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function BuyPagesScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    const pages = customAmount ? parseInt(customAmount) : amount;
    if (!pages || pages < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số trang hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await pageBalanceService.purchasePages(pages);
      Alert.alert('Thành công', `Đã mua ${pages} trang thành công!`, [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.title}>Mua trang in</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Quick Select */}
        <Text style={styles.label}>Chọn nhanh</Text>
        <View style={styles.quickGrid}>
          {QUICK_AMOUNTS.map((qty) => (
            <TouchableOpacity
              key={qty}
              style={[styles.quickCard, amount === qty && !customAmount && styles.quickCardActive]}
              onPress={() => {
                setAmount(qty);
                setCustomAmount('');
              }}
            >
              <Text style={[styles.quickAmount, amount === qty && !customAmount && styles.quickAmountActive]}>
                {qty}
              </Text>
              <Text style={[styles.quickLabel, amount === qty && !customAmount && styles.quickLabelActive]}>
                trang
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Custom Amount */}
        <Text style={styles.label}>Hoặc nhập số lượng</Text>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Nhập số trang"
            placeholderTextColor="#9CA3AF"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={setCustomAmount}
          />
          <Text style={styles.inputSuffix}>trang</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số trang mua</Text>
            <Text style={styles.summaryValue}>{customAmount || amount} trang</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Thành tiền</Text>
            <Text style={styles.summaryTotal}>
              {((customAmount ? parseInt(customAmount) : amount) * 500).toLocaleString('vi-VN')}đ
            </Text>
          </View>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, loading && styles.purchaseBtnDisabled]}
          onPress={handlePurchase}
          disabled={loading}
        >
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={styles.purchaseBtnText}>
            {loading ? 'Đang xử lý...' : 'Thanh toán'}
          </Text>
        </TouchableOpacity>
      </View>
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
  content: { flex: 1, padding: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 12, marginTop: 8 },
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  quickCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  quickCardActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  quickAmount: { fontSize: 28, fontWeight: 'bold', color: '#374151' },
  quickAmountActive: { color: '#3B82F6' },
  quickLabel: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  quickLabelActive: { color: '#3B82F6' },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 16,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#111827' },
  inputSuffix: { fontSize: 14, color: '#6B7280' },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  summaryTotal: { fontSize: 18, fontWeight: 'bold', color: '#3B82F6' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  purchaseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 8,
  },
  purchaseBtnDisabled: { opacity: 0.6 },
  purchaseBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
