import { useEffect, useState } from 'react';
import { Slot, useRouter, useSegments } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function RootLayout() {
  const [isChecking, setIsChecking] = useState(true);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const checkInitialAuth = async () => {
      try {
        const token = await AsyncStorage.getItem('accessToken');
        const role = await AsyncStorage.getItem('userRole');
        const inAuthGroup = segments[0] === '(auth)';
        
        console.log('[Auth] Initial check - token:', token ? 'yes' : 'no', 'role:', role, 'inAuthGroup:', inAuthGroup);

        if (!token && !inAuthGroup) {
          // Chưa đăng nhập và không ở trang auth -> redirect to login
          console.log('[Auth] No token, redirecting to login');
          router.replace('/(auth)/login');
        }
        // Nếu đã có token, để user ở trang hiện tại
        // Login/logout sẽ tự navigate
      } catch (error) {
        console.log('[Auth] Error:', error);
        router.replace('/(auth)/login');
      } finally {
        setIsChecking(false);
      }
    };

    checkInitialAuth();
  }, []); // Chỉ chạy 1 lần khi app start

  if (isChecking) {
    return null;
  }

  return <Slot />;
}
