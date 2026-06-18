import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="mood-check-in" />
        <Stack.Screen name="village-map" />
        <Stack.Screen name="noise-souk" />
        <Stack.Screen name="gate-of-patience" />
        <Stack.Screen name="cloud-valley" />
        <Stack.Screen name="backpack-oasis" />
        <Stack.Screen name="focus-garden" />
      </Stack>
    </>
  );
}
