import { useState, useCallback } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { documentService, Document } from '../../../services/documentService';

type TabType = 'upload' | 'list';

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { printerId, tab } = useLocalSearchParams<{ printerId?: string; tab?: string }>();
  const [activeTab, setActiveTab] = useState<TabType>((tab as TabType) || 'upload');
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);

  const loadDocuments = useCallback(async () => {
    setLoadingDocs(true);
    try {
      const response = await documentService.getDocuments(0, 50);
      setDocuments(response.content);
    } catch (error) {
      console.error('Load documents error:', error);
    } finally {
      setLoadingDocs(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (activeTab === 'list') {
        loadDocuments();
      }
    }, [activeTab, loadDocuments])
  );

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        ],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Không thể chọn file');
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert('Lỗi', 'Vui lòng chọn file');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const result = await documentService.uploadDocument(
        selectedFile.uri,
        selectedFile.name,
        selectedFile.mimeType || 'application/pdf',
        (progress) => setUploadProgress(progress)
      );

      Alert.alert('Thành công', result.message, [
        {
          text: 'Xem danh sách',
          onPress: () => {
            setSelectedFile(null);
            setActiveTab('list');
            loadDocuments();
          },
        },
        {
          text: 'Cấu hình in ngay',
          onPress: () => router.push({
            pathname: '/(student)/print/config',
            params: { documentId: result.id, printerId },
          }),
        },
      ]);
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (id: number) => {
    Alert.alert('Xác nhận', 'Bạn có chắc muốn xóa tài liệu này?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Xóa',
        style: 'destructive',
        onPress: async () => {
          try {
            await documentService.deleteDocument(id);
            loadDocuments();
          } catch (error) {
            Alert.alert('Lỗi', (error as Error).message);
          }
        },
      },
    ]);
  };

  const handlePrintSelected = () => {
    if (selectedDocs.length === 0) {
      Alert.alert('Thông báo', 'Vui lòng chọn ít nhất 1 tài liệu');
      return;
    }
    // Navigate to printer selection with document IDs
    router.push({
      pathname: '/(student)/printers',
      params: { documentIds: selectedDocs.join(',') },
    });
  };

  const toggleSelectDoc = (id: number) => {
    setSelectedDocs(prev => 
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const formatFileSize = (kb?: number) => {
    if (!kb) return '0 KB';
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const getFileIcon = (ext: string) => {
    switch (ext?.toUpperCase()) {
      case 'PDF': return { icon: 'document-text', color: '#EF4444' };
      case 'DOCX':
      case 'DOC': return { icon: 'document', color: '#3B82F6' };
      case 'XLSX':
      case 'XLS': return { icon: 'grid', color: '#10B981' };
      case 'PPTX':
      case 'PPT': return { icon: 'easel', color: '#F97316' };
      default: return { icon: 'document-outline', color: '#6B7280' };
    }
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const fileInfo = getFileIcon(item.fileExtension);
    const isSelected = selectedDocs.includes(item.id);
    
    return (
      <TouchableOpacity
        style={[styles.docCard, isSelected && styles.docCardSelected]}
        onPress={() => toggleSelectDoc(item.id)}
        onLongPress={() => handleDeleteDocument(item.id)}
      >
        <View style={[styles.docIcon, { backgroundColor: fileInfo.color + '20' }]}>
          <Ionicons name={fileInfo.icon as any} size={24} color={fileInfo.color} />
        </View>
        <View style={styles.docInfo}>
          <Text style={styles.docName} numberOfLines={1}>{item.fileName}</Text>
          <Text style={styles.docMeta}>
            {item.fileExtension} • {formatFileSize(item.fileSizeKB)} • {item.totalPages || '--'} trang
          </Text>
          <Text style={styles.docDate}>
            {new Date(item.uploadDate).toLocaleDateString('vi-VN')}
          </Text>
        </View>
        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
          {isSelected && <Ionicons name="checkmark" size={16} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>In tài liệu</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'upload' && styles.tabActive]}
          onPress={() => setActiveTab('upload')}
        >
          <Text style={[styles.tabText, activeTab === 'upload' && styles.tabTextActive]}>
            Tải lên
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'list' && styles.tabActive]}
          onPress={() => { setActiveTab('list'); loadDocuments(); }}
        >
          <Text style={[styles.tabText, activeTab === 'list' && styles.tabTextActive]}>
            Danh sách
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'upload' ? (
        <View style={styles.content}>
          <TouchableOpacity style={styles.uploadArea} onPress={pickDocument} disabled={uploading}>
            {selectedFile ? (
              <View style={styles.filePreview}>
                <View style={styles.fileIcon}>
                  <Ionicons name="document-text" size={40} color="#3B82F6" />
                </View>
                <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
                <Text style={styles.fileSize}>{formatFileSize(selectedFile.size ? selectedFile.size / 1024 : 0)}</Text>
                <TouchableOpacity style={styles.changeBtn} onPress={pickDocument}>
                  <Text style={styles.changeBtnText}>Đổi file</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <View style={styles.uploadIcon}>
                  <Ionicons name="cloud-upload" size={48} color="#3B82F6" />
                </View>
                <Text style={styles.uploadTitle}>Chọn tài liệu</Text>
                <Text style={styles.uploadSubtitle}>PDF, DOCX, PPTX, XLSX (tối đa 50MB)</Text>
              </>
            )}
          </TouchableOpacity>

          {uploading && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.uploadBtn, (!selectedFile || uploading) && styles.uploadBtnDisabled]}
            onPress={handleUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="cloud-upload" size={20} color="#fff" />
                <Text style={styles.uploadBtnText}>Upload</Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.formatsSection}>
            <Text style={styles.formatsTitle}>Định dạng hỗ trợ</Text>
            <View style={styles.formatsRow}>
              {['PDF', 'DOCX', 'PPTX', 'XLSX'].map((format) => (
                <View key={format} style={styles.formatBadge}>
                  <Text style={styles.formatText}>{format}</Text>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Lưu ý</Text>
            <Text style={styles.tipsText}>• Sau khi tải lên, chọn tab Danh sách để in</Text>
            <Text style={styles.tipsText}>• Giữ tên file ngắn gọn để dễ tìm kiếm</Text>
            <Text style={styles.tipsText}>• Nhấn giữ để xóa tài liệu</Text>
          </View>
        </View>
      ) : (
        <View style={styles.listContainer}>
          {selectedDocs.length > 0 && (
            <View style={styles.actionBar}>
              <Text style={styles.selectedCount}>{selectedDocs.length} đã chọn</Text>
              <TouchableOpacity style={styles.printSelectedBtn} onPress={handlePrintSelected}>
                <Ionicons name="print" size={18} color="#fff" />
                <Text style={styles.printSelectedText}>In tài liệu</Text>
              </TouchableOpacity>
            </View>
          )}

          <FlatList
            data={documents}
            renderItem={renderDocument}
            keyExtractor={(item) => item.id.toString()}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadDocuments(); }} />
            }
            ListEmptyComponent={
              !loadingDocs ? (
                <View style={styles.emptyState}>
                  <Ionicons name="document-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>Chưa có tài liệu</Text>
                  <Text style={styles.emptySubtext}>Tải lên tài liệu đầu tiên để bắt đầu</Text>
                </View>
              ) : null
            }
          />
        </View>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: '#3B82F6' },
  tabText: { fontSize: 14, fontWeight: '500', color: '#6B7280' },
  tabTextActive: { color: '#3B82F6' },
  content: { flex: 1, padding: 16 },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    marginBottom: 16,
  },
  uploadIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  uploadSubtitle: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  filePreview: { alignItems: 'center' },
  fileIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileName: { fontSize: 15, fontWeight: '500', color: '#111827', textAlign: 'center' },
  fileSize: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  changeBtn: { marginTop: 12 },
  changeBtnText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  progressContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  progressBar: { flex: 1, height: 8, backgroundColor: '#E5E7EB', borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#3B82F6', borderRadius: 4 },
  progressText: { fontSize: 14, fontWeight: '600', color: '#3B82F6', width: 40 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  uploadBtnDisabled: { opacity: 0.5 },
  uploadBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  formatsSection: { marginTop: 24 },
  formatsTitle: { fontSize: 14, fontWeight: '500', color: '#6B7280', marginBottom: 12 },
  formatsRow: { flexDirection: 'row', gap: 8 },
  formatBadge: { backgroundColor: '#F3F4F6', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6 },
  formatText: { fontSize: 12, fontWeight: '600', color: '#6B7280' },
  tipsCard: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  tipsTitle: { fontSize: 14, fontWeight: '600', color: '#92400E', marginBottom: 8 },
  tipsText: { fontSize: 13, color: '#92400E', marginBottom: 4 },
  listContainer: { flex: 1 },
  actionBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  selectedCount: { fontSize: 14, color: '#6B7280' },
  printSelectedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  printSelectedText: { fontSize: 14, fontWeight: '600', color: '#fff' },
  listContent: { padding: 16 },
  docCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  docCardSelected: { borderColor: '#3B82F6', backgroundColor: '#EFF6FF' },
  docIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  docInfo: { flex: 1, marginLeft: 12 },
  docName: { fontSize: 14, fontWeight: '500', color: '#111827' },
  docMeta: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  docDate: { fontSize: 11, color: '#9CA3AF', marginTop: 2 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: { backgroundColor: '#3B82F6', borderColor: '#3B82F6' },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontWeight: '500', color: '#6B7280', marginTop: 12 },
  emptySubtext: { fontSize: 13, color: '#9CA3AF', marginTop: 4 },
});
