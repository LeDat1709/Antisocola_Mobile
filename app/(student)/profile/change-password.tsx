import { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { profileService } from '../../../services/profileService';
import { passwordValidation } from '../../../services/authService';

export default function ChangePasswordScreen() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const validation = passwordValidation.validate(value);
    setPasswordErrors(validation.errors);
  };

  const handleSubmit = async () => {
    setError('');

    if (!currentPassword) {
      setError('Vui lòng nhập mật khẩu hiện tại');
      return;
    }

    const validation = passwordValidation.validate(newPassword);
    if (!validation.isValid) {
      setError('Mật khẩu mới không đáp ứng yêu cầu');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    try {
      await profileService.changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });
      Alert.alert('Thành công', 'Đã đổi mật khẩu thành công', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#374151" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Đổi mật khẩu</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Current Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>MẬT KHẨU HIỆN TẠI</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu hiện tại"
                placeholderTextColor="#9CA3AF"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)}>
                <Ionicons
                  name={showCurrent ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>MẬT KHẨU MỚI</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Nhập mật khẩu mới"
                placeholderTextColor="#9CA3AF"
                value={newPassword}
                onChangeText={handlePasswordChange}
                secureTextEntry={!showNew}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)}>
                <Ionicons
                  name={showNew ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {newPassword && passwordErrors.length > 0 && (
              <View style={styles.passwordHints}>
                {passwordErrors.map((err, idx) => (
                  <Text key={idx} style={styles.passwordError}>• {err}</Text>
                ))}
              </View>
            )}
            {newPassword && passwordErrors.length === 0 && (
              <Text style={styles.passwordValid}>✓ Mật khẩu hợp lệ</Text>
            )}
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>XÁC NHẬN MẬT KHẨU MỚI</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="checkmark-circle-outline" size={18} color="#9CA3AF" />
              <TextInput
                style={styles.input}
                placeholder="Nhập lại mật khẩu mới"
                placeholderTextColor="#9CA3AF"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                editable={!loading}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)}>
                <Ionicons
                  name={showConfirm ? 'eye-off-outline' : 'eye-outline'}
                  size={20}
                  color="#9CA3AF"
                />
              </TouchableOpacity>
            </View>
            {confirmPassword && newPassword !== confirmPassword && (
              <Text style={styles.passwordError}>✗ Mật khẩu không khớp</Text>
            )}
            {confirmPassword && newPassword === confirmPassword && (
              <Text style={styles.passwordValid}>✓ Mật khẩu khớp</Text>
            )}
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitBtnText}>
              {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
            </Text>
          </TouchableOpacity>

          {/* Password Requirements */}
          <View style={styles.requirementsCard}>
            <Text style={styles.requirementsTitle}>Yêu cầu mật khẩu:</Text>
            <Text style={styles.requirementItem}>• Ít nhất 8 ký tự</Text>
            <Text style={styles.requirementItem}>• Ít nhất 1 chữ thường (a-z)</Text>
            <Text style={styles.requirementItem}>• Ít nhất 1 chữ hoa (A-Z)</Text>
            <Text style={styles.requirementItem}>• Ít nhất 1 chữ số (0-9)</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
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
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444' },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 11, fontWeight: '600', color: '#374151', letterSpacing: 0.5, marginBottom: 6 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 10,
  },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#111827' },
  passwordHints: { marginTop: 8 },
  passwordError: { fontSize: 12, color: '#EF4444', marginTop: 4 },
  passwordValid: { fontSize: 12, color: '#10B981', marginTop: 8 },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  requirementsCard: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    padding: 16,
    marginTop: 24,
  },
  requirementsTitle: { fontSize: 13, fontWeight: '600', color: '#374151', marginBottom: 8 },
  requirementItem: { fontSize: 12, color: '#6B7280', marginTop: 4 },
});
