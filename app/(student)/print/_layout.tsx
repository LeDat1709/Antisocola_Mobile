import { Stack } from 'expo-router';

export default function PrintLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="upload" />
      <Stack.Screen name="config" />
      <Stack.Screen name="confirm" />
      <Stack.Screen name="history/index" />
      <Stack.Screen name="history/[id]" />
    </Stack>
  );
}
