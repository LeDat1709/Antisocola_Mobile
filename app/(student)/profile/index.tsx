import { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { profileService, UserProfile } from '../../../services/profileService';
import { authService } from '../../../services/authService';

export default function ProfileScreen() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const updated = await profileService.updateProfile({ fullName, phoneNumber });
      setProfile(updated);
      setEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await authService.logout();
          router.replace('/(auth)/login');
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cá nhân</Text>
        {!editing && (
          <TouchableOpacity onPress={() => setEditing(true)}>
            <Ionicons name="create-outline" size={24} color="#3B82F6" />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={loadProfile} />}
      >
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {profile?.fullName?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={styles.userName}>{profile?.fullName || 'Người dùng'}</Text>
          <Text style={styles.userEmail}>{profile?.email}</Text>
        </View>

        {/* Profile Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.formCard}>
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Họ và tên</Text>
              {editing ? (
                <TextInput
                  style={styles.formInput}
                  value={fullName}
                  onChangeText={setFullName}
                  placeholder="Nhập họ tên"
                />
              ) : (
                <Text style={styles.formValue}>{profile?.fullName || '--'}</Text>
              )}
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Email</Text>
              <Text style={styles.formValue}>{profile?.email || '--'}</Text>
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Số điện thoại</Text>
              {editing ? (
                <TextInput
                  style={styles.formInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="Nhập số điện thoại"
                  keyboardType="phone-pad"
                />
              ) : (
                <Text style={styles.formValue}>{profile?.phoneNumber || '--'}</Text>
              )}
            </View>

            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Loại tài khoản</Text>
              <Text style={styles.formValue}>{profile?.userType || '--'}</Text>
            </View>

            <View style={[styles.formRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.formLabel}>Trạng thái</Text>
              <View style={[styles.statusBadge, { backgroundColor: profile?.status === 'Active' ? '#D1FAE5' : '#FEE2E2' }]}>
                <Text style={[styles.statusText, { color: profile?.status === 'Active' ? '#10B981' : '#EF4444' }]}>
                  {profile?.status === 'Active' ? 'Hoạt động' : profile?.status}
                </Text>
              </View>
            </View>
          </View>

          {editing && (
            <View style={styles.editActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setEditing(false);
                  setFullName(profile?.fullName || '');
                  setPhoneNumber(profile?.phoneNumber || '');
                }}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                onPress={handleSave}
                disabled={saving}
              >
                <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(student)/profile/change-password')}
            >
              <Ionicons name="lock-closed-outline" size={22} color="#374151" />
              <Text style={styles.menuText}>Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(student)/notifications')}
            >
              <Ionicons name="notifications-outline" size={22} color="#374151" />
              <Text style={styles.menuText}>Thông báo</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <Ionicons name="help-circle-outline" size={22} color="#374151" />
              <Text style={styles.menuText}>Hỗ trợ</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <Text style={styles.version}>Phiên bản 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827' },
  content: { flex: 1, padding: 16 },
  avatarSection: { alignItems: 'center', marginBottom: 24 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 20, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  formRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  formLabel: { fontSize: 14, color: '#6B7280' },
  formValue: { fontSize: 14, fontWeight: '500', color: '#111827', maxWidth: '60%', textAlign: 'right' },
  formInput: {
    flex: 1,
    fontSize: 14,
    color: '#111827',
    textAlign: 'right',
    padding: 0,
    marginLeft: 16,
  },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '600' },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  cancelBtnText: { fontSize: 15, fontWeight: '600', color: '#6B7280' },
  saveBtn: {
    flex: 1,
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 14,
    alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.6 },
  saveBtnText: { fontSize: 15, fontWeight: '600', color: '#fff' },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    gap: 12,
  },
  menuText: { flex: 1, fontSize: 15, color: '#374151' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEE2E2',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginBottom: 16,
  },
  logoutText: { fontSize: 15, fontWeight: '600', color: '#EF4444' },
  version: { textAlign: 'center', fontSize: 12, color: '#9CA3AF', marginBottom: 20 },
});
