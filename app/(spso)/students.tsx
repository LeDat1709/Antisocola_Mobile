import { useEffect, useState } from 'react';
import { StyleSheet, Text, View, FlatList, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { spsoService, Student } from '../../services/spsoService';

export default function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const loadStudents = async () => {
    try {
      const data = await spsoService.getStudents(0, 50, search || undefined);
      setStudents(data.content);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadStudents();
  }, []);

  const handleSearch = () => {
    setLoading(true);
    loadStudents();
  };

  const handleAllocatePages = (student: Student) => {
    Alert.prompt(
      'Cấp trang',
      `Nhập số trang A4 cấp cho ${student.fullName}`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Cấp',
          onPress: async (pages) => {
            if (pages && parseInt(pages) > 0) {
              try {
                await spsoService.allocatePages(student.studentId, parseInt(pages), 'Cấp từ mobile');
                Alert.alert('Thành công', `Đã cấp ${pages} trang cho ${student.fullName}`);
                loadStudents();
              } catch (error) {
                Alert.alert('Lỗi', (error as Error).message);
              }
            }
          },
        },
      ],
      'plain-text',
      '',
      'number-pad'
    );
  };

  const renderStudent = ({ item }: { item: Student }) => (
    <View style={styles.studentCard}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{item.fullName?.charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.studentInfo}>
        <Text style={styles.studentName}>{item.fullName}</Text>
        <Text style={styles.studentEmail}>{item.email}</Text>
        <View style={styles.studentMeta}>
          <View style={[styles.statusBadge, { backgroundColor: item.status === 'Active' ? '#D1FAE5' : '#FEE2E2' }]}>
            <Text style={[styles.statusText, { color: item.status === 'Active' ? '#10B981' : '#EF4444' }]}>
              {item.status}
            </Text>
          </View>
          <Text style={styles.balanceText}>{item.a4Balance} trang</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.allocateBtn} onPress={() => handleAllocatePages(item)}>
        <Ionicons name="add-circle" size={24} color="#7C3AED" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Quản lý sinh viên</Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#9CA3AF" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm theo tên, email, MSSV..."
            placeholderTextColor="#9CA3AF"
            value={search}
            onChangeText={setSearch}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
      </View>

      <FlatList
        data={students}
        renderItem={renderStudent}
        keyExtractor={(item) => item.studentId}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadStudents} />}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>Không tìm thấy sinh viên</Text>
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { backgroundColor: '#7C3AED', paddingHorizontal: 20, paddingVertical: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  searchContainer: { padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', borderRadius: 10, paddingHorizontal: 12, gap: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, color: '#111827' },
  list: { padding: 16 },
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#7C3AED', justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: 'bold', color: '#fff' },
  studentInfo: { flex: 1, marginLeft: 12 },
  studentName: { fontSize: 15, fontWeight: '600', color: '#111827' },
  studentEmail: { fontSize: 12, color: '#6B7280', marginTop: 2 },
  studentMeta: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '600' },
  balanceText: { fontSize: 12, color: '#6B7280' },
  allocateBtn: { padding: 8 },
  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 14, color: '#9CA3AF', marginTop: 12 },
});
