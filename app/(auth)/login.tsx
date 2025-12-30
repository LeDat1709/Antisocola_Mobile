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
import { Link, useRouter } from 'expo-router';
import { authService } from '../../services/authService';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // OTP State
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpEmail, setOtpEmail] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [displayOtp, setDisplayOtp] = useState<string | null>(null); // Hiển thị OTP cho email test

  const handleLogin = async () => {
    setError('');

    if (!email || !password) {
      setError('Vui lòng nhập đầy đủ thông tin');
      return;
    }

    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);

    try {
      const result = await authService.login({ email, password });

      if (result.status === 202) {
        // Cần OTP
        setOtpEmail(email);
        const storedDeviceId = await AsyncStorage.getItem('deviceId');
        setDeviceId(storedDeviceId || '');
        setShowOtpModal(true);
        setError('');
        
        // Nếu là email test, hiển thị OTP lên màn hình
        if (email.includes('.test@') || email.includes('test@')) {
          const otpFromResponse = result.data?.otpCode;
          if (otpFromResponse) {
            setDisplayOtp(otpFromResponse);
          }
        }
      } else if (result.status === 200) {
        // Đăng nhập thành công
        const userRole = result.data?.role?.toUpperCase();
        console.log('[Login] Direct login success, role:', userRole);
        
        if (userRole !== 'STUDENT') {
          await authService.logout();
          setError('Trang này chỉ dành cho sinh viên');
          return;
        }
        
        // Verify token was saved
        const savedToken = await AsyncStorage.getItem('accessToken');
        console.log('[Login] Token saved:', savedToken ? 'yes' : 'no');
        
        // Navigate with small delay to ensure state sync
        setTimeout(() => {
          router.replace('/(student)');
        }, 300);
      }
    } catch (err) {
      setError((err as Error).message || 'Đăng nhập thất bại');
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
        email: otpEmail,
        otpCode,
        deviceId,
        rememberDevice: true,
      });

      console.log('[Login] OTP verify result:', JSON.stringify(result, null, 2));

      const userRole = result.data?.role?.toUpperCase();
      console.log('[Login] User role:', userRole);
      
      // Kiểm tra role - cho phép STUDENT hoặc không có role (mặc định là student)
      if (userRole && userRole !== 'STUDENT') {
        await authService.logout();
        setError('Trang này chỉ dành cho sinh viên');
        setShowOtpModal(false);
        setIsLoading(false);
        return;
      }

      // Verify token was saved
      const savedToken = await AsyncStorage.getItem('accessToken');
      console.log('[Login] Token saved:', savedToken ? 'yes' : 'no');

      if (!savedToken) {
        setError('Lỗi lưu token, vui lòng thử lại');
        setIsLoading(false);
        return;
      }

      setShowOtpModal(false);
      setIsLoading(false);
      
      // Navigate to student dashboard with small delay to ensure state sync
      console.log('[Login] Navigating to student dashboard');
      setTimeout(() => {
        router.replace('/(student)');
      }, 300);
    } catch (err) {
      console.log('[Login] OTP verify failed:', (err as Error).message);
      Alert.alert('Lỗi', (err as Error).message);
      setIsLoading(false);
    }
  };

  // OTP Modal
  if (showOtpModal) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => {
                setShowOtpModal(false);
                setOtpCode('');
              }}
            >
              <Ionicons name="arrow-back" size={24} color="#374151" />
            </TouchableOpacity>

            <View style={styles.iconContainer}>
              <View style={styles.iconBox}>
                <Ionicons name="shield-checkmark" size={32} color="#fff" />
              </View>
            </View>

            <Text style={styles.title}>Xác thực OTP</Text>
            <Text style={styles.subtitle}>Nhập mã OTP đã gửi đến {otpEmail}</Text>

            {/* Hiển thị OTP cho email test */}
            {displayOtp && (
              <View style={styles.testOtpBox}>
                <Text style={styles.testOtpLabel}>🔑 Mã OTP (Test Mode):</Text>
                <Text style={styles.testOtpCode}>{displayOtp}</Text>
              </View>
            )}

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
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleVerifyOtp}
              disabled={isLoading}
            >
              <Text style={styles.loginButtonText}>
                {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
              <Ionicons name="print" size={32} color="#fff" />
            </View>
            <Text style={styles.logoText}>⚡HCMSIU SSPS⚡</Text>
            <View style={styles.divider} />
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            {/* Email */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ĐỊA CHỈ EMAIL</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="your.email@siu.edu.vn"
                  placeholderTextColor="#9CA3AF"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  editable={!isLoading}
                />
              </View>
            </View>

            {/* Password */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MẬT KHẨU</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Nhập mật khẩu của bạn"
                  placeholderTextColor="#9CA3AF"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
              </TouchableOpacity>
            </Link>

            {/* Login Button */}
            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Đang xử lý...</Text>
              ) : (
                <>
                  <Ionicons name="log-in-outline" size={20} color="#fff" />
                  <Text style={styles.loginButtonText}>Đăng nhập</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Register Link */}
            <View style={styles.registerContainer}>
              <Text style={styles.registerText}>Chưa có tài khoản? </Text>
              <Link href="/(auth)/register-step1" asChild>
                <TouchableOpacity>
                  <Text style={styles.registerLink}>Tạo tài khoản</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  logoContainer: { alignItems: 'center', marginBottom: 32 },
  logoBox: {
    width: 64,
    height: 64,
    backgroundColor: '#3B82F6',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  logoText: { fontSize: 20, fontWeight: 'bold', color: '#3B82F6' },
  divider: { width: 48, height: 2, backgroundColor: '#3B82F6', marginTop: 8 },
  iconContainer: { alignItems: 'center', marginBottom: 16 },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 24 },
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
  form: { gap: 16 },
  inputGroup: { gap: 6 },
  label: { fontSize: 11, fontWeight: '600', color: '#374151', letterSpacing: 0.5 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 15, color: '#374151' },
  otpInput: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    padding: 16,
    fontSize: 24,
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 12,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  forgotPassword: { alignSelf: 'flex-end' },
  forgotPasswordText: { fontSize: 13, color: '#3B82F6', fontWeight: '500' },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  loginButtonDisabled: { opacity: 0.6 },
  loginButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  registerContainer: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  registerText: { fontSize: 14, color: '#6B7280' },
  registerLink: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  testOtpBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FCD34D',
  },
  testOtpLabel: { fontSize: 13, color: '#92400E', marginBottom: 8 },
  testOtpCode: { fontSize: 32, fontWeight: 'bold', color: '#D97706', letterSpacing: 8 },
});
