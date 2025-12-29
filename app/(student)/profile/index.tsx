import { useEffect, useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Modal,
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
  
  // Edit modal state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [saving, setSaving] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileService.getProfile();
      setProfile(data);
      setEditFullName(data.fullName || '');
      setEditPhoneNumber(data.phoneNumber || '');
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleSaveProfile = async () => {
    if (!editFullName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập họ tên');
      return;
    }

    setSaving(true);
    try {
      const updated = await profileService.updateProfile({
        fullName: editFullName.trim(),
        phoneNumber: editPhoneNumber.trim() || undefined,
      });
      setProfile(updated);
      setShowEditModal(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (error) {
      Alert.alert('Lỗi', (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          try {
            await authService.logout();
            console.log('[Logout] Tokens cleared, navigating to login');
            // Navigate immediately - _layout will handle the redirect
            router.replace('/(auth)/login');
          } catch (error) {
            console.error('[Logout] Error:', error);
            // Still try to navigate even if logout fails
            router.replace('/(auth)/login');
          }
        },
      },
    ]);
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '--';
    return new Date(dateString).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Cá nhân</Text>
        <TouchableOpacity onPress={() => setShowEditModal(true)}>
          <Ionicons name="create-outline" size={24} color="#3B82F6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadProfile(); }} />}
        showsVerticalScrollIndicator={false}
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
          <View style={[styles.statusBadge, { backgroundColor: profile?.status === 'Active' ? '#D1FAE5' : '#FEE2E2' }]}>
            <View style={[styles.statusDot, { backgroundColor: profile?.status === 'Active' ? '#10B981' : '#EF4444' }]} />
            <Text style={[styles.statusText, { color: profile?.status === 'Active' ? '#10B981' : '#EF4444' }]}>
              {profile?.status === 'Active' ? 'Đang hoạt động' : profile?.status}
            </Text>
          </View>
        </View>

        {/* Profile Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Thông tin cá nhân</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="person-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Họ và tên</Text>
                <Text style={styles.infoValue}>{profile?.fullName || '--'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="mail-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>{profile?.email || '--'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="call-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Số điện thoại</Text>
                <Text style={styles.infoValue}>{profile?.phoneNumber || 'Chưa cập nhật'}</Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoIcon}>
                <Ionicons name="shield-checkmark-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Loại tài khoản</Text>
                <Text style={styles.infoValue}>{profile?.userType || '--'}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <View style={styles.infoIcon}>
                <Ionicons name="calendar-outline" size={18} color="#6B7280" />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Ngày tạo tài khoản</Text>
                <Text style={styles.infoValue}>{formatDate(profile?.createdAt || null)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Menu */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cài đặt</Text>
          <View style={styles.menuCard}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(student)/profile/change-password')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="lock-closed-outline" size={20} color="#F59E0B" />
              </View>
              <Text style={styles.menuText}>Đổi mật khẩu</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => router.push('/(student)/notifications')}
            >
              <View style={[styles.menuIcon, { backgroundColor: '#DBEAFE' }]}>
                <Ionicons name="notifications-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.menuText}>Thông báo</Text>
              <Ionicons name="chevron-forward" size={20} color="#D1D5DB" />
            </TouchableOpacity>

            <TouchableOpacity style={[styles.menuItem, { borderBottomWidth: 0 }]}>
              <View style={[styles.menuIcon, { backgroundColor: '#E0E7FF' }]}>
                <Ionicons name="help-circle-outline" size={20} color="#6366F1" />
              </View>
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

        <Text style={styles.version}>HCMSIU SSPS v1.0.0</Text>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Chỉnh sửa thông tin</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Họ và tên</Text>
                <TextInput
                  style={styles.formInput}
                  value={editFullName}
                  onChangeText={setEditFullName}
                  placeholder="Nhập họ và tên"
                  placeholderTextColor="#9CA3AF"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Số điện thoại</Text>
                <TextInput
                  style={styles.formInput}
                  value={editPhoneNumber}
                  onChangeText={setEditPhoneNumber}
                  placeholder="Nhập số điện thoại"
                  placeholderTextColor="#9CA3AF"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>Email</Text>
                <View style={[styles.formInput, styles.formInputDisabled]}>
                  <Text style={styles.formInputDisabledText}>{profile?.email}</Text>
                </View>
                <Text style={styles.formHint}>Email không thể thay đổi</Text>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowEditModal(false);
                    setEditFullName(profile?.fullName || '');
                    setEditPhoneNumber(profile?.phoneNumber || '');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
                  onPress={handleSaveProfile}
                  disabled={saving}
                >
                  <Text style={styles.saveBtnText}>{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
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
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 36, fontWeight: 'bold', color: '#fff' },
  userName: { fontSize: 22, fontWeight: '600', color: '#111827' },
  userEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#6B7280', marginBottom: 8, marginLeft: 4 },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: { flex: 1, marginLeft: 12 },
  infoLabel: { fontSize: 12, color: '#6B7280' },
  infoValue: { fontSize: 15, fontWeight: '500', color: '#111827', marginTop: 2 },
  menuCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: { flex: 1, fontSize: 15, color: '#374151', marginLeft: 12 },
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
    padding: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', color: '#111827' },
  formGroup: { marginBottom: 16 },
  formLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8 },
  formInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    color: '#111827',
  },
  formInputDisabled: {
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
  },
  formInputDisabledText: { fontSize: 15, color: '#6B7280' },
  formHint: { fontSize: 12, color: '#9CA3AF', marginTop: 4 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 8, marginBottom: 20 },
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
});
