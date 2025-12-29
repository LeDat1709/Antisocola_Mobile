import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function PrintScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>In ấn</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(student)/print/upload')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="cloud-upload" size={32} color="#3B82F6" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Upload tài liệu</Text>
            <Text style={styles.optionDesc}>Tải lên file PDF, DOCX để in</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(student)/print/history')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="time" size={32} color="#F59E0B" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Lịch sử in</Text>
            <Text style={styles.optionDesc}>Xem các lệnh in đã gửi</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.optionCard}
          onPress={() => router.push('/(student)/printers')}
        >
          <View style={[styles.optionIcon, { backgroundColor: '#F0FDF4' }]}>
            <Ionicons name="print" size={32} color="#10B981" />
          </View>
          <View style={styles.optionInfo}>
            <Text style={styles.optionTitle}>Danh sách máy in</Text>
            <Text style={styles.optionDesc}>Xem và chọn máy in</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#D1D5DB" />
        </TouchableOpacity>
      </View>
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
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionInfo: { flex: 1, marginLeft: 14 },
  optionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  optionDesc: { fontSize: 13, color: '#6B7280', marginTop: 2 },
});
