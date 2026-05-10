import { useEffect, useState } from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { getToken } from '@/lib/api';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    getToken().then(() => {
      setReady(true);
      SplashScreen.hideAsync();
    });
  }, []);

  // Re-read token on every segment change so login/logout take effect immediately
  useEffect(() => {
    if (!ready) return;
    const inApp = segments[0] === '(app)';
    getToken().then(token => {
      if (!token && inApp) router.replace('/login');
      else if (token && !inApp) router.replace('/(app)');
    });
  }, [ready, segments]);

  if (!ready) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="dark" backgroundColor="#fffaf5" />
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: '#fffaf5' } }} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
