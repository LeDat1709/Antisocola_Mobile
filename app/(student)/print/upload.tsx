import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { documentService } from '../../../services/documentService';

export default function UploadDocumentScreen() {
  const router = useRouter();
  const { printerId } = useLocalSearchParams<{ printerId?: string }>();
  const [selectedFile, setSelectedFile] = useState<DocumentPicker.DocumentPickerAsset | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
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
          text: 'Cấu hình in',
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

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '0 KB';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Upload tài liệu</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {/* Upload Area */}
        <TouchableOpacity style={styles.uploadArea} onPress={pickDocument} disabled={uploading}>
          {selectedFile ? (
            <View style={styles.filePreview}>
              <View style={styles.fileIcon}>
                <Ionicons name="document-text" size={40} color="#3B82F6" />
              </View>
              <Text style={styles.fileName} numberOfLines={2}>{selectedFile.name}</Text>
              <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
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
              <Text style={styles.uploadSubtitle}>PDF, DOC, DOCX (tối đa 50MB)</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Upload Progress */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
            </View>
            <Text style={styles.progressText}>{uploadProgress}%</Text>
          </View>
        )}

        {/* Upload Button */}
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

        {/* Supported Formats */}
        <View style={styles.formatsSection}>
          <Text style={styles.formatsTitle}>Định dạng hỗ trợ</Text>
          <View style={styles.formatsRow}>
            {['PDF', 'DOC', 'DOCX'].map((format) => (
              <View key={format} style={styles.formatBadge}>
                <Text style={styles.formatText}>{format}</Text>
              </View>
            ))}
          </View>
        </View>
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
  headerTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
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
});
