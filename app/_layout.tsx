import Constants from 'expo-constants';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// setOptions is only supported in development/production builds, not Expo Go.
if (Constants.appOwnership !== 'expo') {
  SplashScreen.setOptions({
    duration: 400,
    fade: true,
  });
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="onboarding" />
        <Stack.Screen name="choose-path" />
        <Stack.Screen name="select-grade" />
        <Stack.Screen name="home" />
        <Stack.Screen name="explore" />
        <Stack.Screen name="region" />
        <Stack.Screen name="region-topic" />
        <Stack.Screen name="region-site" />
        <Stack.Screen name="subject" />
        <Stack.Screen name="lesson" />
        <Stack.Screen name="topic-quizzes" />
        <Stack.Screen name="quiz" />
      </Stack>
      <StatusBar style="dark" />
    </GestureHandlerRootView>
  );
}
