import { useEffect, useState } from 'react';
import {
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput,
  Modal, Alert, ActivityIndicator
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { profileService, UserProfile, UpdateProfileRequest, ChangePasswordRequest } from '../../services/profileService';

export default function SPSOProfileScreen() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProfileRequest>({ fullName: '', phoneNumber: '' });
  const [saving, setSaving] = useState(false);

  // Password modal
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState<ChangePasswordRequest>({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState({ current: false, new: false, confirm: false });
  const [passwordError, setPasswordError] = useState('');

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await profileService.getProfile();
      setProfile(data);
      setEditForm({ fullName: data.fullName, phoneNumber: data.phoneNumber || '' });
    } catch (error) {
      console.error(error);
      Alert.alert('Lỗi', 'Không thể tải thông tin');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async () => {
    if (!editForm.fullName?.trim()) {
      Alert.alert('Lỗi', 'Họ tên không được để trống');
      return;
    }
    try {
      setSaving(true);
      const updated = await profileService.updateProfile(editForm);
      setProfile(updated);
      setIsEditing(false);
      Alert.alert('Thành công', 'Đã cập nhật thông tin');
    } catch (error: any) {
      Alert.alert('Lỗi', error.message || 'Không thể cập nhật');
    } finally {
      setSaving(false);
    }
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Mật khẩu phải có ít nhất 8 ký tự';
    if (!/[a-z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ thường';
    if (!/[A-Z]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ hoa';
    if (!/[0-9]/.test(password)) return 'Mật khẩu phải có ít nhất 1 chữ số';
    return '';
  };

  const handleChangePassword = async () => {
    setPasswordError('');

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    const validationError = validatePassword(passwordForm.newPassword);
    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Mật khẩu xác nhận không khớp');
      return;
    }

    try {
      await profileService.changePassword(passwordForm);
      setShowPasswordModal(false);
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      Alert.alert('Thành công', 'Đã đổi mật khẩu');
    } catch (error: any) {
      setPasswordError(error.message || 'Đổi mật khẩu thất bại');
    }
  };

  const handleLogout = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: async () => {
          await AsyncStorage.multiRemove(['accessToken', 'refreshToken', 'userInfo']);
          router.replace('/(auth)/spso-login');
        },
      },
    ]);
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return 'Chưa có';
    const date = new Date(dateStr);
    return `${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} ${date.toLocaleDateString('vi-VN')}`;
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Hồ sơ cá nhân</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#7C3AED" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.title}>Hồ sơ cá nhân</Text>
      </View>

      <ScrollView style={styles.content}>
        {profile && (
          <>
            {/* Avatar Section */}
            <View style={styles.avatarSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{profile.fullName?.charAt(0).toUpperCase() || 'S'}</Text>
              </View>
              <Text style={styles.profileName}>{profile.fullName}</Text>
              <Text style={styles.profileEmail}>{profile.email}</Text>
              <View style={styles.statusBadge}>
                <View style={styles.statusDot} />
                <Text style={styles.statusText}>Hoạt động</Text>
              </View>
            </View>

            {/* Basic Info */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Thông tin cơ bản</Text>
                {!isEditing ? (
                  <TouchableOpacity onPress={() => setIsEditing(true)}>
                    <Text style={styles.editLink}>Chỉnh sửa</Text>
                  </TouchableOpacity>
                ) : (
                  <View style={styles.editActions}>
                    <TouchableOpacity
                      onPress={() => {
                        setIsEditing(false);
                        setEditForm({ fullName: profile.fullName, phoneNumber: profile.phoneNumber || '' });
                      }}
                    >
                      <Text style={styles.cancelLink}>Hủy</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={handleSaveProfile} disabled={saving}>
                      <Text style={styles.saveLink}>{saving ? 'Đang lưu...' : 'Lưu'}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>

              <View style={styles.infoCard}>
                {isEditing ? (
                  <>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Họ và tên</Text>
                      <TextInput
                        style={styles.input}
                        value={editForm.fullName || ''}
                        onChangeText={(v) => setEditForm({ ...editForm, fullName: v })}
                      />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Email</Text>
                      <TextInput style={[styles.input, styles.inputDisabled]} value={profile.email} editable={false} />
                    </View>
                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>Số điện thoại</Text>
                      <TextInput
                        style={styles.input}
                        value={editForm.phoneNumber || ''}
                        onChangeText={(v) => setEditForm({ ...editForm, phoneNumber: v })}
                        placeholder="Chưa cập nhật"
                        keyboardType="phone-pad"
                      />
                    </View>
                  </>
                ) : (
                  <>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Họ và tên</Text>
                      <Text style={styles.infoValue}>{profile.fullName}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Email</Text>
                      <Text style={styles.infoValue}>{profile.email}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={styles.infoLabel}>Số điện thoại</Text>
                      <Text style={styles.infoValue}>{profile.phoneNumber || 'Chưa cập nhật'}</Text>
                    </View>
                  </>
                )}
              </View>
            </View>

            {/* Account Info */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Thông tin tài khoản</Text>
              <View style={styles.infoCard}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Loại tài khoản</Text>
                  <Text style={styles.infoValue}>SPSO</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ngày tạo</Text>
                  <Text style={styles.infoValue}>{formatDate(profile.createdAt || null)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Đăng nhập cuối</Text>
                  <Text style={styles.infoValue}>{formatDateTime(profile.lastLogin || null)}</Text>
                </View>
              </View>
            </View>

            {/* Security */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Bảo mật</Text>
              <View style={styles.infoCard}>
                <View style={styles.warningBox}>
                  <Ionicons name="warning" size={20} color="#F59E0B" />
                  <Text style={styles.warningText}>
                    Mật khẩu phải có ít nhất 8 ký tự, bao gồm chữ hoa, chữ thường và số.
                  </Text>
                </View>
                <TouchableOpacity style={styles.changePasswordBtn} onPress={() => setShowPasswordModal(true)}>
                  <Ionicons name="key-outline" size={20} color="#7C3AED" />
                  <Text style={styles.changePasswordText}>Đổi mật khẩu</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Logout */}
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={22} color="#EF4444" />
              <Text style={styles.logoutText}>Đăng xuất</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Password Modal */}
      <Modal visible={showPasswordModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Đổi mật khẩu</Text>
              <TouchableOpacity
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordError('');
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {passwordError ? (
                <View style={styles.errorBox}>
                  <Text style={styles.errorText}>{passwordError}</Text>
                </View>
              ) : null}

              <Text style={styles.inputLabel}>Mật khẩu hiện tại</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.passwordField}
                  secureTextEntry={!showPassword.current}
                  value={passwordForm.currentPassword}
                  onChangeText={(v) => setPasswordForm({ ...passwordForm, currentPassword: v })}
                />
                <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, current: !showPassword.current })}>
                  <Ionicons name={showPassword.current ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Mật khẩu mới</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.passwordField}
                  secureTextEntry={!showPassword.new}
                  value={passwordForm.newPassword}
                  onChangeText={(v) => setPasswordForm({ ...passwordForm, newPassword: v })}
                />
                <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, new: !showPassword.new })}>
                  <Ionicons name={showPassword.new ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <Text style={styles.inputLabel}>Xác nhận mật khẩu mới</Text>
              <View style={styles.passwordInput}>
                <TextInput
                  style={styles.passwordField}
                  secureTextEntry={!showPassword.confirm}
                  value={passwordForm.confirmPassword}
                  onChangeText={(v) => setPasswordForm({ ...passwordForm, confirmPassword: v })}
                />
                <TouchableOpacity onPress={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}>
                  <Ionicons name={showPassword.confirm ? 'eye-off' : 'eye'} size={20} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setShowPasswordModal(false);
                    setPasswordError('');
                  }}
                >
                  <Text style={styles.cancelBtnText}>Hủy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.submitBtn} onPress={handleChangePassword}>
                  <Text style={styles.submitBtnText}>Đổi mật khẩu</Text>
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
    backgroundColor: '#7C3AED',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  backBtn: { padding: 4 },
  title: { fontSize: 20, fontWeight: 'bold', color: '#fff' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1 },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#7C3AED',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 32, fontWeight: 'bold', color: '#fff' },
  profileName: { fontSize: 20, fontWeight: 'bold', color: '#111827', marginTop: 12 },
  profileEmail: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 12,
  },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#059669' },
  statusText: { fontSize: 13, color: '#059669', fontWeight: '500' },
  section: { padding: 16 },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  editLink: { fontSize: 14, color: '#7C3AED', fontWeight: '500' },
  editActions: { flexDirection: 'row', gap: 16 },
  cancelLink: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  saveLink: { fontSize: 14, color: '#7C3AED', fontWeight: '600' },
  infoCard: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#E5E7EB' },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  infoValue: { fontSize: 14, fontWeight: '500', color: '#111827' },
  inputGroup: { marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '500', color: '#374151', marginBottom: 8, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  inputDisabled: { backgroundColor: '#F3F4F6', color: '#6B7280' },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: '#FEF3C7',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  warningText: { flex: 1, fontSize: 13, color: '#92400E', lineHeight: 18 },
  changePasswordBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#7C3AED',
    borderRadius: 8,
  },
  changePasswordText: { fontSize: 14, fontWeight: '600', color: '#7C3AED' },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 14,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#EF4444' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%' },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  modalBody: { padding: 16 },
  errorBox: { backgroundColor: '#FEF2F2', padding: 12, borderRadius: 8, marginBottom: 16 },
  errorText: { fontSize: 13, color: '#DC2626' },
  passwordInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  passwordField: { flex: 1, paddingVertical: 10, fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 12, marginTop: 20, marginBottom: 20 },
  cancelBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#F3F4F6', borderRadius: 8, alignItems: 'center' },
  cancelBtnText: { fontSize: 14, fontWeight: '600', color: '#374151' },
  submitBtn: { flex: 1, paddingVertical: 12, backgroundColor: '#7C3AED', borderRadius: 8, alignItems: 'center' },
  submitBtnText: { fontSize: 14, fontWeight: '600', color: '#fff' },
});
