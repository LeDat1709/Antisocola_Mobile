import { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  TextInput,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { paymentService, CreatePaymentResponse } from '../../../services/paymentService';
import { pagePricingService } from '../../../services/pagePricingService';

const QUICK_AMOUNTS = [50, 100, 200, 500];

export default function BuyPagesScreen() {
  const router = useRouter();
  const [amount, setAmount] = useState(100);
  const [customAmount, setCustomAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentData, setPaymentData] = useState<CreatePaymentResponse | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Pricing state - lấy từ cấu hình
  const [pricePerPage, setPricePerPage] = useState(500); // Default fallback

  const pages = customAmount ? parseInt(customAmount) || 0 : amount;
  const totalPrice = pages * pricePerPage;

  // Load pricing on mount
  useEffect(() => {
    const loadPricing = async () => {
      try {
        const pricingData = await pagePricingService.getAllPricing();
        const a4Price = pricingData.find((p) => p.paperSize === 'A4');
        if (a4Price) {
          setPricePerPage(a4Price.pricePerPage);
        }
      } catch (error) {
        console.error('Failed to load pricing:', error);
      }
    };
    loadPricing();
  }, []);

  // Countdown and status check for QR modal
  useEffect(() => {
    if (showQRModal && paymentData) {
      // Parse expiry time
      let expiresAtStr = paymentData.expiresAt;
      if (!expiresAtStr.endsWith('Z') && !expiresAtStr.includes('+')) {
        expiresAtStr += 'Z';
      }
      const expiresAt = new Date(expiresAtStr).getTime();

      const updateCountdown = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.floor((expiresAt - now) / 1000));
        setCountdown(remaining);

        if (remaining <= 0) {
          Alert.alert('Hết hạn', 'Giao dịch đã hết hạn.');
          setShowQRModal(false);
          setPaymentData(null);
        }
      };

      updateCountdown();
      intervalRef.current = setInterval(updateCountdown, 1000);

      // Auto check status every 5 seconds
      statusIntervalRef.current = setInterval(async () => {
        try {
          const status = await paymentService.getPaymentStatus(paymentData.paymentCode);
          if (status.status === 'COMPLETED') {
            if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
            if (intervalRef.current) clearInterval(intervalRef.current);
            Alert.alert('Thành công', `Đã mua ${paymentData.a4Pages} trang thành công!`, [
              { text: 'OK', onPress: () => { setShowQRModal(false); router.back(); } },
            ]);
          }
        } catch (error) {
          console.error('Check status error:', error);
        }
      }, 5000);

      return () => {
        if (statusIntervalRef.current) clearInterval(statusIntervalRef.current);
        if (intervalRef.current) clearInterval(intervalRef.current);
      };
    }
  }, [paymentData, showQRModal, router]);

  const handleCreatePayment = async () => {
    if (!pages || pages < 1) {
      Alert.alert('Lỗi', 'Vui lòng nhập số trang hợp lệ');
      return;
    }

    setLoading(true);
    try {
      const response = await paymentService.createPayment(pages);
      setPaymentData(response);
      setShowQRModal(true);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckStatus = async () => {
    if (!paymentData) return;
    setCheckingStatus(true);
    try {
      const status = await paymentService.getPaymentStatus(paymentData.paymentCode);
      if (status.status === 'COMPLETED') {
        Alert.alert('Thành công', `Đã mua ${paymentData.a4Pages} trang thành công!`, [
          { text: 'OK', onPress: () => { setShowQRModal(false); router.back(); } },
        ]);
      } else if (status.status === 'EXPIRED') {
        Alert.alert('Hết hạn', 'Giao dịch đã hết hạn.');
        setShowQRModal(false);
        setPaymentData(null);
      } else {
        Alert.alert('Đang chờ', 'Chưa nhận được thanh toán. Vui lòng thử lại sau.');
      }
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setCheckingStatus(false);
    }
  };

  const handleCancelPayment = async () => {
    if (!paymentData) return;
    Alert.alert('Xác nhận', 'Bạn có chắc muốn hủy giao dịch này?', [
      { text: 'Không', style: 'cancel' },
      {
        text: 'Hủy giao dịch',
        style: 'destructive',
        onPress: async () => {
          try {
            await paymentService.cancelPayment(paymentData.paymentCode);
            setShowQRModal(false);
            setPaymentData(null);
          } catch (error) {
            Alert.alert('Lỗi', (error as Error).message);
          }
        },
      },
    ]);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
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

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
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

        {/* Price Info */}
        <View style={styles.priceInfo}>
          <Ionicons name="information-circle" size={16} color="#3B82F6" />
          <Text style={styles.priceInfoText}>Giá: {pricePerPage.toLocaleString('vi-VN')}đ / trang A4</Text>
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số trang mua</Text>
            <Text style={styles.summaryValue}>{pages} trang A4</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Đơn giá</Text>
            <Text style={styles.summaryValue}>{pricePerPage.toLocaleString('vi-VN')}đ</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryRow}>
            <Text style={styles.totalLabel}>Thành tiền</Text>
            <Text style={styles.summaryTotal}>{totalPrice.toLocaleString('vi-VN')}đ</Text>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.paymentMethod}>
          <Text style={styles.label}>Phương thức thanh toán</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodIcon}>
              <Ionicons name="qr-code" size={24} color="#3B82F6" />
            </View>
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Chuyển khoản ngân hàng</Text>
              <Text style={styles.methodDesc}>Quét mã QR để thanh toán</Text>
            </View>
            <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          </View>
        </View>

        {/* Purchase Button */}
        <TouchableOpacity
          style={[styles.purchaseBtn, (loading || pages < 1) && styles.purchaseBtnDisabled]}
          onPress={handleCreatePayment}
          disabled={loading || pages < 1}
        >
          <Ionicons name="card" size={20} color="#fff" />
          <Text style={styles.purchaseBtnText}>
            {loading ? 'Đang tạo giao dịch...' : 'Tạo giao dịch thanh toán'}
          </Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* QR Payment Modal */}
      <Modal visible={showQRModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Thanh toán</Text>
              <TouchableOpacity onPress={handleCancelPayment}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {paymentData && (
              <ScrollView showsVerticalScrollIndicator={false}>
                {/* Countdown */}
                <View style={styles.countdownContainer}>
                  <Ionicons name="time-outline" size={18} color={countdown < 60 ? '#EF4444' : '#F59E0B'} />
                  <Text style={[styles.countdownText, countdown < 60 && styles.countdownDanger]}>
                    Còn lại: {formatCountdown(countdown)}
                  </Text>
                </View>

                {/* QR Code */}
                <View style={styles.qrContainer}>
                  {paymentData.qrUrl ? (
                    <Image source={{ uri: paymentData.qrUrl }} style={styles.qrImage} resizeMode="contain" />
                  ) : (
                    <View style={styles.qrPlaceholder}>
                      <Ionicons name="qr-code" size={100} color="#D1D5DB" />
                    </View>
                  )}
                </View>

                {/* Bank Info */}
                <View style={styles.bankInfo}>
                  <Text style={styles.bankInfoTitle}>Thông tin chuyển khoản</Text>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Ngân hàng:</Text>
                    <Text style={styles.bankInfoValue}>{paymentData.bankName}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Số tài khoản:</Text>
                    <Text style={styles.bankInfoValue}>{paymentData.bankAccount}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Chủ tài khoản:</Text>
                    <Text style={styles.bankInfoValue}>{paymentData.accountName}</Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Số tiền:</Text>
                    <Text style={[styles.bankInfoValue, styles.bankInfoAmount]}>
                      {paymentData.amount.toLocaleString('vi-VN')}đ
                    </Text>
                  </View>
                  <View style={styles.bankInfoRow}>
                    <Text style={styles.bankInfoLabel}>Nội dung CK:</Text>
                    <Text style={[styles.bankInfoValue, styles.bankInfoCode]}>{paymentData.paymentCode}</Text>
                  </View>
                </View>

                {/* Note */}
                <View style={styles.noteContainer}>
                  <Ionicons name="warning" size={16} color="#F59E0B" />
                  <Text style={styles.noteText}>
                    Vui lòng nhập đúng nội dung chuyển khoản để hệ thống tự động xác nhận
                  </Text>
                </View>

                {/* Actions */}
                <TouchableOpacity
                  style={[styles.checkStatusBtn, checkingStatus && styles.checkStatusBtnDisabled]}
                  onPress={handleCheckStatus}
                  disabled={checkingStatus}
                >
                  <Ionicons name="refresh" size={20} color="#3B82F6" />
                  <Text style={styles.checkStatusBtnText}>
                    {checkingStatus ? 'Đang kiểm tra...' : 'Kiểm tra trạng thái'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancelPayment}>
                  <Text style={styles.cancelBtnText}>Hủy giao dịch</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
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
  priceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    paddingHorizontal: 4,
  },
  priceInfoText: { fontSize: 13, color: '#3B82F6' },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  totalLabel: { fontSize: 15, fontWeight: '600', color: '#111827' },
  summaryTotal: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 4 },
  paymentMethod: { marginTop: 20 },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#3B82F6',
  },
  methodIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  methodInfo: { flex: 1, marginLeft: 12 },
  methodTitle: { fontSize: 15, fontWeight: '600', color: '#111827' },
  methodDesc: { fontSize: 12, color: '#6B7280', marginTop: 2 },
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
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  countdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  countdownText: { fontSize: 14, fontWeight: '600', color: '#F59E0B' },
  countdownDanger: { color: '#EF4444' },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  qrImage: { width: 200, height: 200 },
  qrPlaceholder: {
    width: 200,
    height: 200,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  bankInfo: {
    backgroundColor: '#F8FAFC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  bankInfoTitle: { fontSize: 15, fontWeight: '600', color: '#111827', marginBottom: 12 },
  bankInfoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  bankInfoLabel: { fontSize: 13, color: '#6B7280' },
  bankInfoValue: { fontSize: 13, fontWeight: '500', color: '#111827' },
  bankInfoAmount: { color: '#3B82F6', fontWeight: 'bold' },
  bankInfoCode: { color: '#10B981', fontWeight: 'bold' },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  noteText: { flex: 1, fontSize: 12, color: '#92400E' },
  checkStatusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    gap: 8,
    marginBottom: 12,
  },
  checkStatusBtnDisabled: { opacity: 0.6 },
  checkStatusBtnText: { fontSize: 15, fontWeight: '600', color: '#3B82F6' },
  cancelBtn: {
    alignItems: 'center',
    padding: 14,
    marginBottom: 20,
  },
  cancelBtnText: { fontSize: 14, color: '#EF4444', fontWeight: '500' },
});
