import { Stack } from 'expo-router';

export default function BalanceLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="buy" />
      <Stack.Screen name="transactions" />
    </Stack>
  );
}
