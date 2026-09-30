import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useReceipt } from '../../context/ReceiptContext';

export default function ExpenseSuccessScreen() {
  const { clearReceipt } = useReceipt();

  function handleBackHome() {
    clearReceipt();
    router.replace('/(tabs)/home');
  }

  function handleAnotherReceipt() {
    clearReceipt();
    router.replace('/expense/capture');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.content}>
        <View style={styles.successOuter}>
          <View style={styles.successInner}>
            <Ionicons
              name="checkmark"
              size={46}
              color="#FFFFFF"
            />
          </View>
        </View>

        <Text style={styles.title}>
          Expense Submitted
        </Text>

        <Text style={styles.subtitle}>
          Your receipt and expense details have been submitted successfully.
        </Text>

        <Pressable
          onPress={handleBackHome}
          style={({ pressed }) => [
            styles.primaryButton,
            pressed && styles.buttonPressed,
          ]}
        >
          <Text style={styles.primaryText}>
            Back to Home
          </Text>

          <Ionicons
            name="arrow-forward"
            size={20}
            color="#FFFFFF"
          />
        </Pressable>

        <Pressable
          onPress={handleAnotherReceipt}
          style={({ pressed }) => [
            styles.secondaryButton,
            pressed && styles.secondaryPressed,
          ]}
        >
          <Ionicons
            name="camera-outline"
            size={20}
            color="#0868AE"
          />

          <Text style={styles.secondaryText}>
            Capture Another Expense
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FB',
    overflow: 'hidden',
  },

  glowOne: {
    position: 'absolute',
    width: 260,
    height: 260,
    top: -110,
    right: -120,
    borderRadius: 130,
    backgroundColor: 'rgba(8,104,174,0.06)',
  },

  glowTwo: {
    position: 'absolute',
    width: 220,
    height: 220,
    bottom: -110,
    left: -100,
    borderRadius: 110,
    backgroundColor: 'rgba(22,132,91,0.04)',
  },

  content: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },

  successOuter: {
    width: 116,
    height: 116,
    borderRadius: 58,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#DCF2E8',
  },

  successInner: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#18885F',
    elevation: 3,
  },

  title: {
    marginTop: 28,
    textAlign: 'center',
    fontSize: 29,
    lineHeight: 35,
    fontWeight: '700',
    color: '#0A3558',
  },

  subtitle: {
    marginTop: 10,
    maxWidth: 340,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: '#71879A',
  },

  primaryButton: {
    width: '100%',
    height: 58,
    marginTop: 34,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0868AE',
    elevation: 3,
  },

  primaryText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  secondaryButton: {
    width: '100%',
    height: 56,
    marginTop: 12,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: '#C9DDEB',
    backgroundColor: '#FFFFFF',
  },

  secondaryText: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#0868AE',
  },

  buttonPressed: {
    opacity: 0.95,
    transform: [
      {
        scale: 0.998,
      },
    ],
  },

  secondaryPressed: {
    backgroundColor: '#F7FAFC',
  },
});
