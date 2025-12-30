import { useState, useEffect } from 'react';
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
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from '../../services/authService';

const OTP_EXPIRATION_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default function RegisterStep2Screen() {
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpCountdown, setOtpCountdown] = useState(OTP_EXPIRATION_SECONDS);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN_SECONDS);

  // Load data từ AsyncStorage khi mount
  useEffect(() => {
    const loadRegistrationData = async () => {
      try {
        const storedEmail = await AsyncStorage.getItem('registrationEmail');
        const storedToken = await AsyncStorage.getItem('registrationToken');
        const otpSentAt = await AsyncStorage.getItem('otpSentAt');
        
        if (storedEmail) setEmail(storedEmail);
        if (storedToken) setRegistrationToken(storedToken);
        
        // Tính thời gian còn lại của OTP
        if (otpSentAt) {
          const elapsed = Math.floor((Date.now() - parseInt(otpSentAt)) / 1000);
          const remaining = Math.max(0, OTP_EXPIRATION_SECONDS - elapsed);
          setOtpCountdown(remaining);
        }
      } catch (err) {
        console.log('[Register] Error loading data:', err);
      }
    };
    loadRegistrationData();
  }, []);

  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleVerifyOtp = async () => {
    setError('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    if (otpCountdown <= 0) {
      setError('Mã OTP đã hết hạn. Vui lòng gửi lại.');
      return;
    }

    setIsLoading(true);
    try {
      console.log('[Register] Verifying OTP:', {
        email,
        otpCode,
        registrationToken,
      });

      const result = await authService.verifyRegistrationOtp({
        email,
        otpCode,
        registrationToken,
      });

      console.log('[Register] OTP verify result:', result);

      // Xóa data đăng ký khỏi storage
      await AsyncStorage.multiRemove(['registrationEmail', 'registrationToken', 'otpSentAt', 'registrationData']);

      Alert.alert('Thành công', 'Đăng ký thành công! Vui lòng đăng nhập.', [
        { text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      console.log('[Register] OTP verify error:', (err as Error).message);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setIsLoading(true);
    try {
      // Lấy lại data đăng ký từ storage
      const registrationDataStr = await AsyncStorage.getItem('registrationData');
      if (!registrationDataStr) {
        Alert.alert('Lỗi', 'Không tìm thấy thông tin đăng ký. Vui lòng quay lại bước 1.');
        return;
      }

      const registrationData = JSON.parse(registrationDataStr);
      const response = await authService.initiateRegistration(registrationData);

      // Cập nhật token mới
      await AsyncStorage.setItem('registrationToken', response.data.registrationToken);
      await AsyncStorage.setItem('otpSentAt', Date.now().toString());
      
      setRegistrationToken(response.data.registrationToken);
      setOtpCountdown(OTP_EXPIRATION_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpCode('');
      
      Alert.alert('Thành công', 'Mã OTP mới đã được gửi đến email của bạn');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

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
          {/* Header */}
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBox}>
              <Ionicons name="mail" size={32} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Xác thực OTP</Text>
          <Text style={styles.subtitle}>
            Nhập mã OTP đã gửi đến {email || '...'}
          </Text>

          {/* OTP Countdown */}
          <View style={[styles.countdownBox, otpCountdown <= 0 && styles.countdownExpired]}>
            <Ionicons
              name={otpCountdown > 0 ? 'time-outline' : 'alert-circle-outline'}
              size={18}
              color={otpCountdown > 0 ? '#3B82F6' : '#F59E0B'}
            />
            <Text style={[styles.countdownText, otpCountdown <= 0 && styles.countdownTextExpired]}>
              {otpCountdown > 0
                ? `OTP còn hiệu lực: ${formatTime(otpCountdown)}`
                : 'OTP đã hết hạn'}
            </Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* OTP Input */}
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

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyBtn, (isLoading || otpCountdown <= 0) && styles.verifyBtnDisabled]}
            onPress={handleVerifyOtp}
            disabled={isLoading || otpCountdown <= 0}
          >
            <Text style={styles.verifyBtnText}>
              {isLoading ? 'Đang xử lý...' : 'Xác nhận'}
            </Text>
          </TouchableOpacity>

          {/* Resend */}
          <TouchableOpacity
            style={styles.resendBtn}
            onPress={handleResendOtp}
            disabled={resendCooldown > 0 || isLoading}
          >
            <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
              {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : 'Gửi lại OTP'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, padding: 24 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
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
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  countdownExpired: { backgroundColor: '#FEF3C7' },
  countdownText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  countdownTextExpired: { color: '#F59E0B' },
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
  verifyBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
  },
  verifyBtnDisabled: { opacity: 0.6 },
  verifyBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  resendBtn: { alignItems: 'center', paddingVertical: 16 },
  resendText: { fontSize: 14, color: '#3B82F6', fontWeight: '500' },
  resendTextDisabled: { color: '#9CA3AF' },
});
