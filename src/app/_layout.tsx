import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { ReceiptProvider } from '../context/ReceiptContext';

export default function RootLayout() {
  return (
    <ReceiptProvider>
     <StatusBar
  style="light"
/>

      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'fade',
          contentStyle: {
            backgroundColor: '#062B4A',
          },
        }}
      />
    </ReceiptProvider>
  );
}