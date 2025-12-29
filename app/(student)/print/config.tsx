import { useEffect, useState, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { documentService, Document } from '../../../services/documentService';
import { printerService, Printer } from '../../../services/printerService';
import { printJobService } from '../../../services/printJobService';
import { pageBalanceService, PageBalance } from '../../../services/pageBalanceService';

export default function PrintConfigScreen() {
  const router = useRouter();
  const { documentId, documentIds, printerId } = useLocalSearchParams<{ 
    documentId?: string; 
    documentIds?: string;
    printerId?: string 
  }>();

  const [documents, setDocuments] = useState<Document[]>([]);
  const [printer, setPrinter] = useState<Printer | null>(null);
  const [balance, setBalance] = useState<PageBalance | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Configuration
  const [paperSize, setPaperSize] = useState<'A4' | 'A3'>('A4');
  const [duplex, setDuplex] = useState(true);
  const [copies, setCopies] = useState(1);
  const [pageRangeType, setPageRangeType] = useState<'all' | 'custom'>('all');
  const [pageRangeInput, setPageRangeInput] = useState('');
  const [colorMode, setColorMode] = useState<'bw' | 'color' | 'partial'>('bw');
  const [colorPageRange, setColorPageRange] = useState('');
  const [pageRangeError, setPageRangeError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load documents
        if (documentIds) {
          const ids = documentIds.split(',').map(id => parseInt(id.trim()));
          const docs = await Promise.all(ids.map(id => documentService.getDocumentById(id)));
          setDocuments(docs);
        } else if (documentId) {
          const doc = await documentService.getDocumentById(parseInt(documentId));
          setDocuments([doc]);
        }

        // Load printer
        if (printerId) {
          const p = await printerService.getPrinterById(parseInt(printerId));
          setPrinter(p);
        }

        // Load balance
        const bal = await pageBalanceService.getBalance();
        setBalance(bal);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [documentId, documentIds, printerId]);

  // Validate page range
  useEffect(() => {
    if (pageRangeType === 'custom' && pageRangeInput.trim()) {
      const maxPages = documents.length > 0 ? (documents[0].totalPages || 100) : 100;
      const validation = validatePageRange(pageRangeInput, maxPages);
      setPageRangeError(validation.valid ? null : validation.error || null);
    } else {
      setPageRangeError(null);
    }
  }, [pageRangeInput, pageRangeType, documents]);

  // Calculate pages
  const calculation = useCallback(() => {
    if (documents.length === 0) {
      return { totalPages: 0, pagesA4Equivalent: 0, balanceBefore: 0, balanceAfter: 0, hasEnoughBalance: false };
    }

    let totalDocPages = 0;
    let totalA4Equivalent = 0;

    documents.forEach(doc => {
      const docPages = doc.totalPages || 10;
      totalDocPages += docPages;

      const pageRange = pageRangeType === 'custom' ? pageRangeInput : undefined;
      const a4Eq = printJobService.calculatePages(docPages, paperSize, duplex, copies, pageRange);
      totalA4Equivalent += a4Eq;
    });

    const balanceBefore = balance?.pagesA4 || 0;
    const balanceAfter = balanceBefore - totalA4Equivalent;

    return {
      totalPages: totalDocPages,
      pagesA4Equivalent: totalA4Equivalent,
      balanceBefore,
      balanceAfter,
      hasEnoughBalance: balanceAfter >= 0,
    };
  }, [documents, paperSize, duplex, copies, pageRangeType, pageRangeInput, balance]);

  const calc = calculation();

  const validatePageRange = (range: string, maxPages: number): { valid: boolean; error?: string } => {
    if (!range.trim()) return { valid: true };
    
    const ranges = range.split(',').map(r => r.trim());
    for (const r of ranges) {
      if (r.includes('-')) {
        const [start, end] = r.split('-').map(n => parseInt(n.trim()));
        if (isNaN(start) || isNaN(end)) return { valid: false, error: 'Định dạng không hợp lệ' };
        if (start <= 0 || end > maxPages) return { valid: false, error: `Trang phải từ 1 đến ${maxPages}` };
        if (start > end) return { valid: false, error: 'Trang bắt đầu phải nhỏ hơn trang kết thúc' };
      } else {
        const page = parseInt(r);
        if (isNaN(page) || page <= 0 || page > maxPages) {
          return { valid: false, error: `Trang phải từ 1 đến ${maxPages}` };
        }
      }
    }
    return { valid: true };
  };

  const handleSelectPrinter = () => {
    const params: any = {};
    if (documentIds) params.documentIds = documentIds;
    else if (documentId) params.documentId = documentId;
    router.push({ pathname: '/(student)/printers', params });
  };

  const handleSubmit = async () => {
    if (!printer) {
      Alert.alert('Lỗi', 'Vui lòng chọn máy in');
      return;
    }

    if (!calc.hasEnoughBalance) {
      Alert.alert('Không đủ trang', 'Vui lòng nạp thêm trang để tiếp tục', [
        { text: 'Hủy' },
        { text: 'Mua trang', onPress: () => router.push('/(student)/balance/buy') },
      ]);
      return;
    }

    if (pageRangeError) {
      Alert.alert('Lỗi', 'Vui lòng kiểm tra lại trang cần in');
      return;
    }

    setSubmitting(true);
    try {
      // Submit for each document
      for (const doc of documents) {
        let finalColorMode: 'BlackWhite' | 'Color' = 'BlackWhite';
        let finalColorPageRange: string | undefined = undefined;

        if (colorMode === 'color') {
          finalColorMode = 'Color';
        } else if (colorMode === 'partial') {
          finalColorMode = 'BlackWhite';
          finalColorPageRange = colorPageRange || undefined;
        }

        await printJobService.submitPrintJob({
          documentId: doc.id,
          printerId: printer.printerId,
          paperSize,
          pageRange: pageRangeType === 'custom' ? pageRangeInput : undefined,
          duplex,
          copies,
          colorMode: finalColorMode,
          colorPageRange: finalColorPageRange,
        });
      }

      Alert.alert('Thành công', `Đã gửi lệnh in cho ${documents.length} tài liệu!`, [
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
        <Text style={styles.headerTitle}>Cấu hình in</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Steps Indicator */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepDone]}>
              <Ionicons name="checkmark" size={14} color="#fff" />
            </View>
            <Text style={styles.stepText}>Tài liệu</Text>
          </View>
          <View style={[styles.stepLine, styles.stepLineDone]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, printer ? styles.stepDone : styles.stepActive]}>
              {printer ? <Ionicons name="checkmark" size={14} color="#fff" /> : <Text style={styles.stepNumber}>2</Text>}
            </View>
            <Text style={styles.stepText}>Máy in</Text>
          </View>
          <View style={[styles.stepLine, printer ? styles.stepLineDone : {}]} />
          <View style={styles.stepItem}>
            <View style={[styles.stepCircle, styles.stepActive]}>
              <Text style={styles.stepNumber}>3</Text>
            </View>
            <Text style={styles.stepText}>Cấu hình</Text>
          </View>
        </View>

        {/* Document Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Tài liệu {documents.length > 1 ? `(${documents.length})` : ''}
          </Text>
          {documents.map((doc) => (
            <View key={doc.id} style={styles.docCard}>
              <View style={styles.docIcon}>
                <Ionicons name="document-text" size={20} color="#3B82F6" />
              </View>
              <View style={styles.docInfo}>
                <Text style={styles.docName} numberOfLines={1}>{doc.fileName}</Text>
                <Text style={styles.docMeta}>
                  {doc.fileExtension} • {doc.totalPages || '?'} trang
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Printer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Máy in</Text>
          <TouchableOpacity style={styles.printerSelect} onPress={handleSelectPrinter}>
            {printer ? (
              <>
                <View style={styles.printerIcon}>
                  <Ionicons name="print" size={20} color="#10B981" />
                </View>
                <View style={styles.printerInfo}>
                  <Text style={styles.printerName}>{printer.printerName}</Text>
                  <Text style={styles.printerLocation}>{printer.location}</Text>
                  <View style={styles.printerFeatures}>
                    {printer.colorPrinting && (
                      <View style={styles.featureBadge}>
                        <Text style={styles.featureText}>Màu</Text>
                      </View>
                    )}
                    {printer.duplexPrinting && (
                      <View style={styles.featureBadge}>
                        <Text style={styles.featureText}>2 mặt</Text>
                      </View>
                    )}
                  </View>
                </View>
              </>
            ) : (
              <>
                <Ionicons name="add-circle-outline" size={24} color="#6B7280" />
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
            <TouchableOpacity
              style={[styles.optionBtn, paperSize === 'A4' && styles.optionBtnActive]}
              onPress={() => setPaperSize('A4')}
            >
              <Text style={[styles.optionText, paperSize === 'A4' && styles.optionTextActive]}>
                A4
              </Text>
              <Text style={styles.optionSubtext}>210 × 297 mm</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionBtn, 
                paperSize === 'A3' && styles.optionBtnActive,
                !printer?.paperSizes?.includes('A3') && styles.optionBtnDisabled
              ]}
              onPress={() => printer?.paperSizes?.includes('A3') && setPaperSize('A3')}
              disabled={!printer?.paperSizes?.includes('A3')}
            >
              <Text style={[
                styles.optionText, 
                paperSize === 'A3' && styles.optionTextActive,
                !printer?.paperSizes?.includes('A3') && styles.optionTextDisabled
              ]}>
                A3
              </Text>
              <Text style={[
                styles.optionSubtext,
                !printer?.paperSizes?.includes('A3') && styles.optionTextDisabled
              ]}>297 × 420 mm</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Page Range */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trang cần in</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioItem}
              onPress={() => setPageRangeType('all')}
            >
              <View style={[styles.radio, pageRangeType === 'all' && styles.radioActive]}>
                {pageRangeType === 'all' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioText}>Tất cả trang</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.radioItem}
              onPress={() => setPageRangeType('custom')}
            >
              <View style={[styles.radio, pageRangeType === 'custom' && styles.radioActive]}>
                {pageRangeType === 'custom' && <View style={styles.radioDot} />}
              </View>
              <Text style={styles.radioText}>Tùy chọn</Text>
            </TouchableOpacity>
          </View>
          {pageRangeType === 'custom' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={[styles.input, pageRangeError && styles.inputError]}
                placeholder="VD: 1-5, 10, 15-20"
                placeholderTextColor="#9CA3AF"
                value={pageRangeInput}
                onChangeText={setPageRangeInput}
              />
              {pageRangeError && <Text style={styles.errorText}>{pageRangeError}</Text>}
              <Text style={styles.hintText}>Nhập các trang cách nhau bởi dấu phẩy</Text>
            </View>
          )}
        </View>

        {/* Duplex */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>In 2 mặt</Text>
          <View style={styles.optionsRow}>
            <TouchableOpacity
              style={[styles.optionBtn, !duplex && styles.optionBtnActive]}
              onPress={() => setDuplex(false)}
            >
              <Ionicons name="document-outline" size={20} color={!duplex ? '#3B82F6' : '#6B7280'} />
              <Text style={[styles.optionText, !duplex && styles.optionTextActive]}>1 mặt</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionBtn, 
                duplex && styles.optionBtnActive,
                !printer?.duplexPrinting && styles.optionBtnDisabled
              ]}
              onPress={() => printer?.duplexPrinting && setDuplex(true)}
              disabled={!printer?.duplexPrinting}
            >
              <Ionicons 
                name="copy-outline" 
                size={20} 
                color={duplex ? '#3B82F6' : (!printer?.duplexPrinting ? '#D1D5DB' : '#6B7280')} 
              />
              <Text style={[
                styles.optionText, 
                duplex && styles.optionTextActive,
                !printer?.duplexPrinting && styles.optionTextDisabled
              ]}>2 mặt</Text>
            </TouchableOpacity>
          </View>
          {duplex && (
            <Text style={styles.savingText}>💡 Tiết kiệm 50% giấy</Text>
          )}
        </View>

        {/* Color Mode */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Màu sắc</Text>
          <View style={styles.radioGroup}>
            <TouchableOpacity 
              style={styles.radioItem}
              onPress={() => setColorMode('bw')}
            >
              <View style={[styles.radio, colorMode === 'bw' && styles.radioActive]}>
                {colorMode === 'bw' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={styles.radioText}>Đen trắng</Text>
                <Text style={styles.radioSubtext}>Tất cả trang</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioItem, !printer?.colorPrinting && styles.radioItemDisabled]}
              onPress={() => printer?.colorPrinting && setColorMode('color')}
              disabled={!printer?.colorPrinting}
            >
              <View style={[
                styles.radio, 
                colorMode === 'color' && styles.radioActive,
                !printer?.colorPrinting && styles.radioDisabled
              ]}>
                {colorMode === 'color' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={[styles.radioText, !printer?.colorPrinting && styles.radioTextDisabled]}>
                  Màu
                </Text>
                <Text style={[styles.radioSubtext, !printer?.colorPrinting && styles.radioTextDisabled]}>
                  Tất cả trang {!printer?.colorPrinting && '(Không hỗ trợ)'}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.radioItem, !printer?.colorPrinting && styles.radioItemDisabled]}
              onPress={() => printer?.colorPrinting && setColorMode('partial')}
              disabled={!printer?.colorPrinting}
            >
              <View style={[
                styles.radio, 
                colorMode === 'partial' && styles.radioActive,
                !printer?.colorPrinting && styles.radioDisabled
              ]}>
                {colorMode === 'partial' && <View style={styles.radioDot} />}
              </View>
              <View style={styles.radioContent}>
                <Text style={[styles.radioText, !printer?.colorPrinting && styles.radioTextDisabled]}>
                  Màu cho một số trang
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {colorMode === 'partial' && (
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="VD: 1, 3-5, 10 (trang cần in màu)"
                placeholderTextColor="#9CA3AF"
                value={colorPageRange}
                onChangeText={setColorPageRange}
              />
              <Text style={styles.hintText}>Các trang khác sẽ in đen trắng</Text>
            </View>
          )}

          {(colorMode === 'color' || colorMode === 'partial') && printer?.colorPrinting && (
            <View style={styles.warningBox}>
              <Ionicons name="warning" size={16} color="#F59E0B" />
              <Text style={styles.warningText}>In màu tiêu tốn nhiều mực hơn</Text>
            </View>
          )}
        </View>

        {/* Copies */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Số bản in</Text>
          <View style={styles.copiesRow}>
            <TouchableOpacity
              style={styles.copiesBtn}
              onPress={() => setCopies(Math.max(1, copies - 1))}
            >
              <Ionicons name="remove" size={20} color="#374151" />
            </TouchableOpacity>
            <Text style={styles.copiesValue}>{copies}</Text>
            <TouchableOpacity
              style={styles.copiesBtn}
              onPress={() => setCopies(Math.min(10, copies + 1))}
            >
              <Ionicons name="add" size={20} color="#374151" />
            </TouchableOpacity>
          </View>
          <Text style={styles.hintText}>Tối đa 10 bản</Text>
        </View>

        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Tổng quan</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Tổng số trang</Text>
            <Text style={styles.summaryValue}>{calc.totalPages} trang</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Trang A4 tương đương</Text>
            <Text style={[styles.summaryValue, styles.summaryHighlight]}>{calc.pagesA4Equivalent} trang</Text>
          </View>
          
          <View style={styles.summaryDivider} />
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số dư hiện tại</Text>
            <Text style={styles.summaryValue}>{calc.balanceBefore} trang A4</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Số dư sau khi in</Text>
            <Text style={[
              styles.summaryValue, 
              { color: calc.hasEnoughBalance ? '#10B981' : '#EF4444' }
            ]}>
              {calc.balanceAfter} trang A4
            </Text>
          </View>

          {!calc.hasEnoughBalance && (
            <TouchableOpacity 
              style={styles.buyMoreBtn}
              onPress={() => router.push('/(student)/balance/buy')}
            >
              <Text style={styles.buyMoreText}>Mua thêm trang →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[
            styles.submitBtn, 
            (!calc.hasEnoughBalance || !printer || submitting || pageRangeError) && styles.submitBtnDisabled
          ]}
          onPress={handleSubmit}
          disabled={!calc.hasEnoughBalance || !printer || submitting || !!pageRangeError}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="print" size={20} color="#fff" />
              <Text style={styles.submitBtnText}>Xác nhận in</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
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

  // Steps
  stepsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    paddingVertical: 12,
  },
  stepItem: { alignItems: 'center' },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDone: { backgroundColor: '#10B981' },
  stepActive: { backgroundColor: '#3B82F6' },
  stepNumber: { fontSize: 12, fontWeight: '600', color: '#fff' },
  stepText: { fontSize: 11, color: '#6B7280', marginTop: 4 },
  stepLine: { width: 40, height: 2, backgroundColor: '#E5E7EB', marginHorizontal: 8 },
  stepLineDone: { backgroundColor: '#10B981' },

  // Section
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#374151', marginBottom: 10 },

  // Document Card
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    gap: 12,
  },
  docIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { flex: 1 },
  docName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  docMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Printer Select
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
  printerIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  printerInfo: { flex: 1 },
  printerName: { fontSize: 14, fontWeight: '600', color: '#111827' },
  printerLocation: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  printerFeatures: { flexDirection: 'row', gap: 6, marginTop: 6 },
  featureBadge: { backgroundColor: '#DBEAFE', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  featureText: { fontSize: 10, color: '#3B82F6', fontWeight: '500' },
  selectText: { flex: 1, fontSize: 14, color: '#6B7280' },

  // Options Row
  optionsRow: { flexDirection: 'row', gap: 12 },
  optionBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  optionBtnActive: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  optionBtnDisabled: { opacity: 0.5 },
  optionText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },
  optionTextActive: { color: '#3B82F6' },
  optionTextDisabled: { color: '#D1D5DB' },
  optionSubtext: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  savingText: { fontSize: 12, color: '#10B981', marginTop: 8, textAlign: 'center' },

  // Radio Group
  radioGroup: { backgroundColor: '#fff', borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  radioItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  radioItemDisabled: { opacity: 0.5 },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: { borderColor: '#3B82F6' },
  radioDisabled: { borderColor: '#E5E7EB' },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#3B82F6' },
  radioContent: { flex: 1 },
  radioText: { fontSize: 14, fontWeight: '500', color: '#111827' },
  radioTextDisabled: { color: '#9CA3AF' },
  radioSubtext: { fontSize: 12, color: '#6B7280', marginTop: 2 },

  // Input
  inputContainer: { marginTop: 12 },
  input: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  inputError: { borderColor: '#EF4444' },
  errorText: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  hintText: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },

  // Warning Box
  warningBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    padding: 10,
    gap: 8,
    marginTop: 12,
  },
  warningText: { fontSize: 12, color: '#92400E', flex: 1 },

  // Copies
  copiesRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 20 },
  copiesBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  copiesValue: { fontSize: 28, fontWeight: 'bold', color: '#111827', minWidth: 50, textAlign: 'center' },

  // Summary Card
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#DBEAFE',
    marginBottom: 16,
  },
  summaryTitle: { fontSize: 16, fontWeight: '600', color: '#111827', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  summaryLabel: { fontSize: 14, color: '#6B7280' },
  summaryValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  summaryHighlight: { color: '#3B82F6', fontSize: 16 },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  buyMoreBtn: { marginTop: 12 },
  buyMoreText: { fontSize: 14, color: '#3B82F6', fontWeight: '500', textAlign: 'center' },

  // Submit Button
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
});
