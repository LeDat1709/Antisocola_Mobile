import { StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';

export default function BalanceScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Text style={styles.title}>Số dư trang</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.icon}>💳</Text>
        <Text style={styles.text}>Quản lý số dư</Text>
        <Text style={styles.subtext}>Sẽ được triển khai</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 64,
    marginBottom: 16,
  },
  text: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
  },
  subtext: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
});
