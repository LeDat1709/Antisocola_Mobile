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
import { forgotPasswordService, passwordValidation } from '../../services/forgotPasswordService';

type Step = 'email' | 'reset';

const OTP_EXPIRATION_SECONDS = 5 * 60;
const RESEND_COOLDOWN_SECONDS = 60;

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<string[]>([]);

  const [otpCountdown, setOtpCountdown] = useState(0);
  const [resendCooldown, setResendCooldown] = useState(0);

  // OTP countdown timer
  useEffect(() => {
    if (otpCountdown > 0) {
      const timer = setTimeout(() => setOtpCountdown(otpCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [otpCountdown]);

  // Resend cooldown timer
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

  const handleSendOtp = async () => {
    setError('');
    if (!email) {
      setError('Vui lòng nhập email');
      return;
    }
    if (!email.includes('@')) {
      setError('Email không hợp lệ');
      return;
    }

    setIsLoading(true);
    try {
      const response = await forgotPasswordService.sendOtp(email);
      setStep('reset');
      setOtpCountdown(OTP_EXPIRATION_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setSuccess(`OTP đã được gửi đến ${response.email}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return;

    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const response = await forgotPasswordService.sendOtp(email);
      setOtpCountdown(OTP_EXPIRATION_SECONDS);
      setResendCooldown(RESEND_COOLDOWN_SECONDS);
      setOtpCode('');
      setSuccess(`OTP mới đã được gửi đến ${response.email}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = (value: string) => {
    setNewPassword(value);
    const validation = passwordValidation.validate(value);
    setPasswordErrors(validation.errors);
  };

  const handleResetPassword = async () => {
    setError('');
    setSuccess('');

    if (!otpCode || otpCode.length !== 6) {
      setError('Vui lòng nhập mã OTP 6 chữ số');
      return;
    }

    if (otpCountdown <= 0) {
      setError('Mã OTP đã hết hạn. Vui lòng gửi lại OTP mới.');
      return;
    }

    const validation = passwordValidation.validate(newPassword);
    if (!validation.isValid) {
      setError('Mật khẩu không đáp ứng yêu cầu');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setIsLoading(true);
    try {
      await forgotPasswordService.resetPassword({
        email,
        otpCode,
        newPassword,
        confirmPassword,
      });
      Alert.alert('Thành công', 'Mật khẩu đã được đặt lại thành công!', [
        { text: 'Đăng nhập', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    if (step === 'reset') {
      setStep('email');
      setOtpCode('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      setSuccess('');
    } else {
      router.back();
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
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#374151" />
          </TouchableOpacity>

          {/* Icon */}
          <View style={styles.iconContainer}>
            <View style={styles.iconBox}>
              <Ionicons name="key" size={32} color="#fff" />
            </View>
          </View>

          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>
            {step === 'email' ? 'Nhập email để nhận mã OTP' : 'Nhập OTP và mật khẩu mới'}
          </Text>

          {/* Step Indicator */}
          <View style={styles.stepIndicator}>
            <View style={[styles.stepDot, step === 'email' ? styles.stepActive : styles.stepDone]}>
              <Text style={styles.stepText}>{step === 'email' ? '1' : '✓'}</Text>
            </View>
            <View style={[styles.stepLine, step === 'reset' && styles.stepLineActive]} />
            <View style={[styles.stepDot, step === 'reset' ? styles.stepActive : styles.stepInactive]}>
              <Text style={[styles.stepText, step !== 'reset' && styles.stepTextInactive]}>2</Text>
            </View>
          </View>

          {/* Success Message */}
          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successText}>{success}</Text>
            </View>
          ) : null}

          {/* Error Message */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Step 1: Email */}
          {step === 'email' && (
            <View style={styles.form}>
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

              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleSendOtp}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Đang gửi...</Text>
                ) : (
                  <>
                    <Ionicons name="send" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Gửi mã OTP</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Step 2: OTP + New Password */}
          {step === 'reset' && (
            <View style={styles.form}>
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
                    : 'OTP đã hết hạn. Vui lòng gửi lại.'}
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MÃ OTP (6 CHỮ SỐ)</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="keypad-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, styles.otpInput]}
                    placeholder="123456"
                    placeholderTextColor="#9CA3AF"
                    value={otpCode}
                    onChangeText={(text) => setOtpCode(text.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!isLoading}
                  />
                </View>
              </View>

              {/* New Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>MẬT KHẨU MỚI</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="lock-closed-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    value={newPassword}
                    onChangeText={handlePasswordChange}
                    secureTextEntry={!showNewPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                    <Ionicons
                      name={showNewPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {newPassword && passwordErrors.length > 0 && (
                  <View style={styles.passwordErrors}>
                    {passwordErrors.map((err, idx) => (
                      <Text key={idx} style={styles.passwordErrorText}>• {err}</Text>
                    ))}
                  </View>
                )}
                {newPassword && passwordErrors.length === 0 && (
                  <Text style={styles.passwordValid}>✓ Mật khẩu hợp lệ</Text>
                )}
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>XÁC NHẬN MẬT KHẨU</Text>
                <View style={styles.inputContainer}>
                  <Ionicons name="checkmark-circle-outline" size={18} color="#9CA3AF" style={styles.inputIcon} />
                  <TextInput
                    style={styles.input}
                    placeholder="Nhập lại mật khẩu mới"
                    placeholderTextColor="#9CA3AF"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                    editable={!isLoading}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons
                      name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={20}
                      color="#9CA3AF"
                    />
                  </TouchableOpacity>
                </View>
                {confirmPassword && newPassword !== confirmPassword && (
                  <Text style={styles.passwordErrorText}>✗ Mật khẩu không khớp</Text>
                )}
                {confirmPassword && newPassword === confirmPassword && (
                  <Text style={styles.passwordValid}>✓ Mật khẩu khớp</Text>
                )}
              </View>

              <TouchableOpacity
                style={[styles.button, (isLoading || otpCountdown <= 0) && styles.buttonDisabled]}
                onPress={handleResetPassword}
                disabled={isLoading || otpCountdown <= 0}
              >
                {isLoading ? (
                  <Text style={styles.buttonText}>Đang xử lý...</Text>
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#fff" />
                    <Text style={styles.buttonText}>Đặt lại mật khẩu</Text>
                  </>
                )}
              </TouchableOpacity>

              {/* Resend OTP */}
              <TouchableOpacity
                style={styles.resendButton}
                onPress={handleResendOtp}
                disabled={resendCooldown > 0 || isLoading}
              >
                <Text style={[styles.resendText, resendCooldown > 0 && styles.resendTextDisabled]}>
                  {resendCooldown > 0 ? `Gửi lại sau ${resendCooldown}s` : '🔄 Gửi lại OTP'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Back to login */}
          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => router.replace('/(auth)/login')}
          >
            <Text style={styles.loginLinkText}>← Quay lại đăng nhập</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 24,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBox: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  stepIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  stepDot: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepActive: {
    backgroundColor: '#3B82F6',
  },
  stepDone: {
    backgroundColor: '#10B981',
  },
  stepInactive: {
    backgroundColor: '#E5E7EB',
  },
  stepText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  stepTextInactive: {
    color: '#9CA3AF',
  },
  stepLine: {
    width: 48,
    height: 3,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  stepLineActive: {
    backgroundColor: '#3B82F6',
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  successText: {
    flex: 1,
    fontSize: 13,
    color: '#10B981',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    color: '#EF4444',
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#374151',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#374151',
  },
  otpInput: {
    letterSpacing: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3B82F6',
    borderRadius: 10,
    paddingVertical: 14,
    gap: 8,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#fff',
  },
  countdownBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    padding: 12,
    gap: 8,
  },
  countdownExpired: {
    backgroundColor: '#FEF3C7',
  },
  countdownText: {
    fontSize: 13,
    color: '#3B82F6',
    fontWeight: '500',
  },
  countdownTextExpired: {
    color: '#F59E0B',
  },
  passwordErrors: {
    marginTop: 6,
  },
  passwordErrorText: {
    fontSize: 12,
    color: '#EF4444',
    marginTop: 2,
  },
  passwordValid: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 6,
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  resendText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  resendTextDisabled: {
    color: '#9CA3AF',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 24,
  },
  loginLinkText: {
    fontSize: 14,
    color: '#6B7280',
  },
});
