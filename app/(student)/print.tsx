import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

export default function PrintScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>In tài liệu</Text>
      </View>

      <View style={styles.content}>
        {/* Upload Area */}
        <TouchableOpacity style={styles.uploadArea}>
          <View style={styles.uploadIconBox}>
            <Ionicons name="cloud-upload" size={48} color="#3B82F6" />
          </View>
          <Text style={styles.uploadTitle}>Tải lên tài liệu</Text>
          <Text style={styles.uploadSubtitle}>
            Nhấn để chọn file PDF, DOC, DOCX
          </Text>
          <View style={styles.uploadButton}>
            <Ionicons name="add" size={20} color="#fff" />
            <Text style={styles.uploadButtonText}>Chọn file</Text>
          </View>
        </TouchableOpacity>

        {/* Supported Formats */}
        <View style={styles.formatsSection}>
          <Text style={styles.formatsTitle}>Định dạng hỗ trợ</Text>
          <View style={styles.formatsRow}>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>PDF</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>DOC</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>DOCX</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>JPG</Text>
            </View>
            <View style={styles.formatBadge}>
              <Text style={styles.formatText}>PNG</Text>
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  uploadArea: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
  },
  uploadIconBox: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  uploadTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 20,
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3B82F6',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  formatsSection: {
    marginTop: 24,
  },
  formatsTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 12,
  },
  formatsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  formatBadge: {
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  formatText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
  },
});
