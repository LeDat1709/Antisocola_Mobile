import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { documentService, Document } from '../../../services/documentService';
import { printerService, Printer } from '../../../services/printerService';
import { printJobService } from '../../../services/printJobService';
import { pageBalanceService, PageBalance } from '../../../services/pageBalanceService';

export default function PrintConfirmScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    documentId: string;
    printerId: string;
    paperSize: string;
    duplex: string;
    copies: string;
    pageRange: string;
    colorMode: string;
  }>();

  const [document, setDocument] = useState<Document | null>(null);
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [balance, setBalance] = useState<PageBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const config = {
    paperSize: (params.paperSize || 'A4') as 'A4' | 'A3',
    duplex: params.duplex === '1',
    copies: parseInt(params.copies || '1'),
    pageRange: params.pageRange || '',
    colorMode: (params.colorMode || 'BlackWhite') as 'BlackWhite' | 'Color',
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const [doc, p, bal] = await Promise.all([
          documentService.getDocumentById(parseInt(params.documentId)),
          printerService.getPrinterById(parseInt(params.printerId)),
          pageBalanceService.getBalance(),
        ]);
        setDocument(doc);
        setPrinter(p);
        setBalance(bal);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [params.documentId, params.printerId]);

  const totalPages = document?.totalPages || 0;
  const pagesRequired = printJobService.calculatePages(
    totalPages,
    config.paperSize,
    config.duplex,
    config.copies,
    config.pageRange
  );
  const hasEnoughBalance = (balance?.pagesA4 || 0) >= pagesRequired;

  const handleSubmit = async () => {
    if (!hasEnoughBalance) {
      Alert.alert('Không đủ trang', 'Vui lòng nạp thêm trang để tiếp tục', [
        { text: 'Hủy' },
        { text: 'Mua trang', onPress: () => router.push('/(student)/balance/buy') },
      ]);
      return;
    }

    setSubmitting(true);
    try {
      await printJobService.submitPrintJob({
        documentId: parseInt(params.documentId),
        printerId: parseInt(params.printerId),
        paperSize: config.paperSize,
        duplex: config.duplex,
        copies: config.copies,
        pageRange: config.pageRange || undefined,
        colorMode: config.colorMode,
      });

      Alert.alert('Thành công', 'Lệnh in đã được gửi!', [
        { text: 'Xem lịch sử', onPress: () => router.replace('/(student)/print/history') },
        { text: 'Về trang chủ', onPress: () => router.replace('/(student)') },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setSubmitting(false);
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

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Xác nhận in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Document */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tài liệu</Text>
          <View style={styles.infoCard}>
            <Ionicons name="document-text" size={20} color="#3B82F6" />
            <Text style={styles.infoText} numberOfLines={1}>{document?.fileName}</Text>
          </View>
        </View>

        {/* Printer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Máy in</Text>
          <View style={styles.infoCard}>
            <Ionicons name="print" size={20} color="#10B981" />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoText}>{printer?.printerName}</Text>
              <Text style={styles.infoSubtext}>{printer?.location}</Text>
            </View>
          </View>
        </View>

        {/* Config Summary */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cấu hình</Text>
          <View style={styles.configCard}>
            <ConfigRow label="Khổ giấy" value={config.paperSize} />
            <ConfigRow label="In 2 mặt" value={config.duplex ? 'Có' : 'Không'} />
            <ConfigRow label="Số bản" value={config.copies.toString()} />
            <ConfigRow label="Phạm vi" value={config.pageRange || 'Tất cả'} />
          </View>
        </View>

        {/* Cost Summary */}
        <View style={styles.costCard}>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Số trang cần</Text>
            <Text style={styles.costValue}>{pagesRequired} trang A4</Text>
          </View>
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Số dư hiện tại</Text>
            <Text style={[styles.costValue, { color: hasEnoughBalance ? '#10B981' : '#EF4444' }]}>
              {balance?.pagesA4 || 0} trang
            </Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.costRow}>
            <Text style={styles.costLabel}>Còn lại sau in</Text>
            <Text style={[styles.costTotal, { color: hasEnoughBalance ? '#10B981' : '#EF4444' }]}>
              {(balance?.pagesA4 || 0) - pagesRequired} trang
            </Text>
          </View>
        </View>

        {!hasEnoughBalance && (
          <View style={styles.warningBox}>
            <Ionicons name="warning" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>Không đủ trang. Vui lòng nạp thêm.</Text>
          </View>
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && styles.submitBtnDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Xác nhận in</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ConfigRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.configRow}>
      <Text style={styles.configLabel}>{label}</Text>
      <Text style={styles.configValue}>{value}</Text>
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
  section: { marginBottom: 16 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 8 },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoText: { fontSize: 14, fontWeight: '500', color: '#111827', flex: 1 },
  infoSubtext: { fontSize: 12, color: '#6B7280' },
  configCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  configRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  configLabel: { fontSize: 14, color: '#6B7280' },
  configValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  costCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  costRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  costLabel: { fontSize: 14, color: '#6B7280' },
  costValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  costTotal: { fontSize: 18, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 10,
    padding: 12,
    gap: 10,
    marginBottom: 16,
  },
  warningText: { fontSize: 13, color: '#92400E', flex: 1 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
