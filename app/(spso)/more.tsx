import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface MenuItem {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  route?: string;
  color: string;
  bg: string;
  action?: () => void;
}

export default function SPSOMoreScreen() {
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

  const menuItems: MenuItem[] = [
    { icon: 'people', label: 'Quản lý tài khoản', route: '/(spso)/accounts', color: '#3B82F6', bg: '#EFF6FF' },
    { icon: 'location', label: 'Quản lý vị trí', route: '/(spso)/locations', color: '#10B981', bg: '#ECFDF5' },
    { icon: 'swap-horizontal', label: 'Giao dịch', route: '/(spso)/transactions', color: '#8B5CF6', bg: '#F5F3FF' },
    { icon: 'bar-chart', label: 'Báo cáo thống kê', route: '/(spso)/reports', color: '#F59E0B', bg: '#FEF3C7' },
    { icon: 'settings', label: 'Cài đặt hệ thống', route: '/(spso)/settings', color: '#6B7280', bg: '#F3F4F6' },
    { icon: 'person-circle', label: 'Hồ sơ cá nhân', route: '/(spso)/profile', color: '#EC4899', bg: '#FCE7F3' },
  ];

  const handlePress = (item: MenuItem) => {
    if (item.action) {
      item.action();
    } else if (item.route) {
      router.push(item.route as any);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Thêm</Text>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.menuGrid}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.menuItem, { backgroundColor: item.bg }]}
              onPress={() => handlePress(item)}
              activeOpacity={0.7}
            >
              <View style={[styles.iconContainer, { backgroundColor: item.color }]}>
                <Ionicons name={item.icon} size={24} color="#fff" />
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
              <Ionicons name="chevron-forward" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
          <Ionicons name="log-out-outline" size={22} color="#EF4444" />
          <Text style={styles.logoutText}>Đăng xuất</Text>
        </TouchableOpacity>

        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>SPSO Mobile v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: '#7C3AED',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  content: { flex: 1, padding: 16 },
  menuGrid: { gap: 12 },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    padding: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#EF4444',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});
