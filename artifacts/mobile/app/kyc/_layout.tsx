import { Stack } from 'expo-router';

export default function KycLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="document-type" />
      <Stack.Screen name="document-scan" />
      <Stack.Screen name="processing" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
