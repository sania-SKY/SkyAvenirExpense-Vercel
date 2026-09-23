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
      <StatusBar
        style="dark"
        backgroundColor="#F4F8FB"
      />

      {/* SOFT BACKGROUND DETAILS */}

      <View style={styles.glowOne} />
      <View style={styles.glowTwo} />

      <View style={styles.content}>
        {/* SUCCESS ICON */}

        <View style={styles.successOuter}>
          <View style={styles.successInner}>
            <Ionicons
              name="checkmark"
              size={46}
              color="#FFFFFF"
            />
          </View>
        </View>

        {/* MAIN TEXT */}

        <Text style={styles.title}>
          Expense Submitted
        </Text>

        <Text style={styles.subtitle}>
          Your receipt and expense details have
          been submitted successfully.
        </Text>

        {/* STATUS CARD */}

        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons
              name="time-outline"
              size={23}
              color="#0868AE"
            />
          </View>

          <View style={styles.statusTextWrap}>
            <Text style={styles.statusTitle}>
              Processing
            </Text>

            <Text style={styles.statusDescription}>
              Your expense is being prepared and
              will appear in your expense history.
            </Text>
          </View>
        </View>

        {/* INFO CARD */}

        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={20}
            color="#16845B"
          />

          <Text style={styles.infoText}>
            Your submission has been saved locally for testing.
          </Text>
        </View>

        {/* ACTIONS */}

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
            Submit Another Receipt
          </Text>
        </Pressable>
      </View>

      {/* FOOTER */}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          SKY AVENIR EXPENSE
        </Text>

        <Text style={styles.footerSubtext}>
          Simple. Secure. Efficient.
        </Text>
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

    backgroundColor:
      'rgba(8,104,174,0.06)',
  },

  glowTwo: {
    position: 'absolute',

    width: 220,
    height: 220,

    bottom: -110,
    left: -100,

    borderRadius: 110,

    backgroundColor:
      'rgba(22,132,91,0.04)',
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

  statusCard: {
    width: '100%',

    marginTop: 29,

    padding: 17,

    flexDirection: 'row',
    alignItems: 'center',

    borderRadius: 20,

    backgroundColor: '#E8F3FA',
  },

  statusIcon: {
    width: 48,
    height: 48,

    borderRadius: 15,

    alignItems: 'center',
    justifyContent: 'center',

    backgroundColor: '#D6EAF6',
  },

  statusTextWrap: {
    flex: 1,
    marginLeft: 13,
  },

  statusTitle: {
    fontSize: 14.5,
    fontWeight: '700',

    color: '#174966',
  },

  statusDescription: {
    marginTop: 3,

    fontSize: 11.5,
    lineHeight: 17,

    color: '#5E7A8D',
  },

  infoCard: {
    width: '100%',

    marginTop: 12,

    paddingHorizontal: 15,
    paddingVertical: 12,

    flexDirection: 'row',
    alignItems: 'center',

    gap: 9,

    borderRadius: 16,

    backgroundColor: '#EAF7F0',
  },

  infoText: {
    flex: 1,

    fontSize: 11.5,
    lineHeight: 16,

    color: '#4B6F61',
  },

  primaryButton: {
    width: '100%',
    height: 58,

    marginTop: 28,

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

  footer: {
    position: 'absolute',

    bottom: 30,
    left: 20,
    right: 20,

    alignItems: 'center',
  },

  footerText: {
    fontSize: 9,
    fontWeight: '700',

    letterSpacing: 2,

    color: '#70899C',
  },

  footerSubtext: {
    marginTop: 4,

    fontSize: 9.5,

    color: '#9AABB7',
  },
});