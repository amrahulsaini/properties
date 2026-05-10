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
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        const token = await getToken();
        setAuthed(!!token);
      } finally {
        setReady(true);
        SplashScreen.hideAsync();
      }
    }
    bootstrap();
  }, []);

  useEffect(() => {
    if (!ready) return;
    const inApp = segments[0] === '(app)';
    if (!authed && inApp) router.replace('/login');
    else if (authed && !inApp) router.replace('/(app)');
  }, [ready, authed, segments]);

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
