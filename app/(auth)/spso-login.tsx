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
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function SPSOLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [deviceId, setDeviceId] = useState('');

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login({ email, password });

      if (result.status === 202) {
        const storedDeviceId = await AsyncStorage.getItem('deviceId');
        setDeviceId(storedDeviceId || '');
        setShowOtpModal(true);
      } else if (result.status === 200) {
        const userRole = result.data?.role?.toUpperCase();
        if (userRole !== 'SPSO' && userRole !== 'ADMIN') {
          await authService.logout();
          setError('Trang này chỉ dành cho SPSO/Admin');
          return;
        }
        router.replace('/(spso)');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      Alert.alert('Lỗi', 'Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.verifyOtp({
        email,
        otpCode,
        deviceId,
        rememberDevice: true,
      });

      const userRole = result.data?.role?.toUpperCase();
      if (userRole !== 'SPSO' && userRole !== 'ADMIN') {
        await authService.logout();
        setError('Trang này chỉ dành cho SPSO/Admin');
        setShowOtpModal(false);
        return;
      }

      setShowOtpModal(false);
      router.replace('/(spso)');
    } catch (err) {
      Alert.alert('Lỗi', (err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  if (showOtpModal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity style={styles.backBtn} onPress={() => { setShowOtpModal(false); setOtpCode(''); }}>
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <View style={[styles.iconBox, { backgroundColor: '#7C3AED' }]}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP đã gửi đến {email}</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MÃ OTP</Text>
              <TextInput
                style={styles.otpInput}
                placeholder="123456"
                placeholderTextColor="#9CA3AF"
                value={otpCode}
                onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: '#7C3AED' }, isLoading && styles.loginButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>{isLoading ? 'Đang xử lý...' : 'Xác nhận'}</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={[styles.logoBox, { backgroundColor: '#7C3AED' }]}>
              <Ionicons name="settings" size={32} color="#fff" />
            </View>
            <Text style={[styles.logoText, { color: '#7C3AED' }]}>SPSO Portal</Text>
            <View style={[styles.divider, { backgroundColor: '#7C3AED' }]} />
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>EMAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="admin@siu.edu.vn"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>MẬT KHẨU</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={20} color="#9CA3AF" />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: '#7C3AED' }, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Đang xử lý...</Text>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Đăng nhập SPSO</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.studentLink} onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.studentLinkText}>← Đăng nhập sinh viên</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center', marginBottom: 24 },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  logoText: { fontSize: 20, fontWeight: 'bold' },
  divider: { width: 48, height: 2, marginTop: 8 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  iconBox: { width: 64, height: 64, borderRadius: 16, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF2F2', borderRadius: 8, padding: 12, gap: 8, marginBottom: 16 },
  errorText: { flex: 1, fontSize: 13, color: '#EF4444' },
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600', color: '#374151', letterSpacing: 0.5 },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 12, gap: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#374151' },
  otpInput: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 10, padding: 16, fontSize: 24, color: '#111827', textAlign: 'center', letterSpacing: 12 },
  loginButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', borderRadius: 10, paddingVertical: 14, gap: 8, marginTop: 8 },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  studentLink: { alignItems: 'center', marginTop: 16 },
  studentLinkText: { fontSize: 14, color: '#6B7280' },
});
