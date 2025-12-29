import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { documentService, Document } from '../../../services/documentService';
import { printerService, Printer } from '../../../services/printerService';

export default function PrintConfigScreen() {
  const router = useRouter();
  const { documentId, printerId } = useLocalSearchParams<{ documentId: string; printerId?: string }>();

  const [document, setDocument] = useState<Document | null>(null);
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [config, setConfig] = useState({
    paperSize: 'A4' as 'A4' | 'A3',
    duplex: false,
    copies: 1,
    pageRange: '',
    colorMode: 'BlackWhite' as 'BlackWhite' | 'Color',
  });

  useEffect(() => {
    const loadData = async () => {
      try {
        if (documentId) {
          const doc = await documentService.getDocumentById(parseInt(documentId));
          setDocument(doc);
        }
        if (printerId) {
          const p = await printerService.getPrinterById(parseInt(printerId));
          setPrinter(p);
        }
      } catch (error) {
        console.error(error);
      }
    };
    loadData();
  }, [documentId, printerId]);

  const handleSelectPrinter = () => {
    router.push('/(student)/printers');
  };

  const handleContinue = () => {
    if (!printer) {
      Alert.alert('Lỗi', 'Vui lòng chọn máy in');
      return;
    }

    router.push({
      pathname: '/(student)/print/confirm',
      params: {
        documentId,
        printerId: printer.printerId,
        paperSize: config.paperSize,
        duplex: config.duplex ? '1' : '0',
        copies: config.copies,
        pageRange: config.pageRange,
        colorMode: config.colorMode,
      },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Cấu hình in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* Document Info */}
        {document && (
          <View style={styles.docCard}>
            <Ionicons name="document-text" size={24} color="#3B82F6" />
            <View style={styles.docInfo}>
              <Text style={styles.docName} numberOfLines={1}>{document.fileName}</Text>
              <Text style={styles.docMeta}>
                {document.totalPages || '?'} trang • {document.fileExtension}
              </Text>
            </View>
          </View>
        )}

        {/* Printer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Máy in</Text>
          <TouchableOpacity style={styles.printerSelect} onPress={handleSelectPrinter}>
            {printer ? (
              <>
                <Ionicons name="print" size={20} color="#3B82F6" />
                <View style={styles.printerInfo}>
                  <Text style={styles.printerName}>{printer.printerName}</Text>
                  <Text style={styles.printerLocation}>{printer.location}</Text>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={20} color="#6B7280" />
                <Text style={styles.selectText}>Chọn máy in</Text>
              </>
            )}
            <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
          </TouchableOpacity>
        </View>

        {/* Paper Size */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Khổ giấy</Text>
          <View style={styles.optionsRow}>
            {(['A4', 'A3'] as const).map((size) => (
              <TouchableOpacity
                key={size}
                style={[styles.optionBtn, config.paperSize === size && styles.optionBtnActive]}
                onPress={() => setConfig({ ...config, paperSize: size })}
              >
                <Text style={[styles.optionText, config.paperSize === size && styles.optionTextActive]}>
                  {size}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Duplex */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In 2 mặt</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionBtn, !config.duplex && styles.optionBtnActive]}
              onPress={() => setConfig({ ...config, duplex: false })}
            >
              <Text style={[styles.optionText, !config.duplex && styles.optionTextActive]}>1 mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.optionBtn, config.duplex && styles.optionBtnActive]}
              onPress={() => setConfig({ ...config, duplex: true })}
            >
              <Text style={[styles.optionText, config.duplex && styles.optionTextActive]}>2 mặt</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Copies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số bản in</Text>
          <View style={styles.copiesRow}>
            <TouchableOpacity
              style={styles.copiesBtn}
              onPress={() => setConfig({ ...config, copies: Math.max(1, config.copies - 1) })}
            >
              <Ionicons name="remove" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.copiesValue}>{config.copies}</Text>
            <TouchableOpacity
              style={styles.copiesBtn}
              onPress={() => setConfig({ ...config, copies: Math.min(10, config.copies + 1) })}
            >
              <Ionicons name="add" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Phạm vi trang (tùy chọn)</Text>
          <TextInput
            style={styles.input}
            placeholder="VD: 1-5, 10, 15-20 (để trống = tất cả)"
            placeholderTextColor="#9CA3AF"
            value={config.pageRange}
            onChangeText={(text) => setConfig({ ...config, pageRange: text })}
          />
        </View>

        {/* Continue Button */}
        <TouchableOpacity style={styles.continueBtn} onPress={handleContinue}>
          <Text style={styles.continueBtnText}>Tiếp tục</Text>
          <Ionicons name="arrow-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </ScrollView>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  content: { flex: 1, padding: 16 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
    gap: 12,
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  docMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },
  printerSelect: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 12,
  },
  printerInfo: { flex: 1 },
  printerName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  printerLocation: { fontSize: 12, color: '#6B7280' },
  selectText: { flex: 1, fontSize: 14, color: '#6B7280' },
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  optionText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  optionTextActive: { color: '#3B82F6' },
  copiesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  copiesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiesValue: { fontSize: 24, fontWeight: 'bold', color: '#111827', minWidth: 40, textAlign: 'center' },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  continueBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginTop: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
