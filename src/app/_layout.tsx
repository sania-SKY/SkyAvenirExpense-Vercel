import { useEffect } from 'react';

import { Stack, router, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';

import { AuthProvider, useAuth } from '../context/AuthContext';
import { ReceiptProvider } from '../context/ReceiptContext';

/*
 * ------------------------------------------------
 * ROOT NAVIGATOR
 * ------------------------------------------------
 *
 * Nothing is allowed to render until the stored
 * session has been restored. The access token is
 * held in memory by services/auth.ts, so mounting a
 * screen first would let it call authenticatedFetch()
 * with an empty token and fail with "Your session is
 * not available" - which is exactly what happened
 * when the app was opened straight to /home from an
 * iOS Home Screen icon.
 * ------------------------------------------------
 */
function RootNavigator() {
  const { status } = useAuth();
  const segments = useSegments();

  useEffect(() => {
    if (status === 'restoring') {
      return;
    }

    const inAuthGroup = segments[0] === '(auth)';

    if (status === 'unauthenticated' && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    if (status === 'authenticated' && inAuthGroup) {
      router.replace('/(tabs)/home');
    }
  }, [status, segments]);

  if (status === 'restoring') {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#062B4A',
        }}
      />
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'fade',
        contentStyle: {
          backgroundColor: '#062B4A',
        },
      }}
    />
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ReceiptProvider>
        <StatusBar style="light" />

        <RootNavigator />
      </ReceiptProvider>
    </AuthProvider>
  );
}
