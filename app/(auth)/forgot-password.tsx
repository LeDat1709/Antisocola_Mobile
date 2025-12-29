import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function ForgotPasswordScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quên mật khẩu</Text>
      <Text style={styles.subtitle}>Trang quên mật khẩu sẽ được triển khai</Text>
      <StatusBar style="dark" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
});
