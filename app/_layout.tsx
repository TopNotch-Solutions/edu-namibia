import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.setOptions({
  duration: 400,
  fade: true,
});

export default function RootLayout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="select-grade" />
        <Stack.Screen name="home" />
        <Stack.Screen name="subject" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
