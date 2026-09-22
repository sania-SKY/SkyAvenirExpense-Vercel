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

  function goHome() {
    clearReceipt();

    router.replace('/(tabs)/home');
  }

  function addAnother() {
    clearReceipt();

    router.replace('/expense/capture');
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.successIcon}>
        <Ionicons
          name="checkmark"
          size={48}
          color="#FFFFFF"
        />
      </View>

      <Text style={styles.title}>
        Expense Submitted
      </Text>

      <Text style={styles.subtitle}>
        Your receipt and expense details have
        been submitted successfully.
      </Text>

      <View style={styles.statusCard}>
        <View style={styles.statusIcon}>
          <Ionicons
            name="time-outline"
            size={22}
            color="#075A98"
          />
        </View>

        <View style={styles.statusText}>
          <Text style={styles.statusTitle}>
            Processing
          </Text>

          <Text style={styles.statusDescription}>
            Your expense will appear in your
            expense history.
          </Text>
        </View>
      </View>

      <Pressable
        style={styles.primaryButton}
        onPress={goHome}
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
        style={styles.secondaryButton}
        onPress={addAnother}
      >
        <Ionicons
          name="camera-outline"
          size={20}
          color="#075A98"
        />

        <Text style={styles.secondaryText}>
          Submit Another Receipt
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F5F9FC',
  },

  successIcon: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16845B',
  },

  title: {
    marginTop: 27,
    fontSize: 28,
    fontWeight: '700',
    color: '#082F56',
  },

  subtitle: {
    marginTop: 10,
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    color: '#6D8395',
  },

  statusCard: {
    width: '100%',
    marginTop: 30,
    padding: 17,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 18,
    backgroundColor: '#E8F3FA',
  },

  statusIcon: {
    width: 45,
    height: 45,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#D5EAF6',
  },

  statusText: {
    flex: 1,
    marginLeft: 13,
  },

  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#174966',
  },

  statusDescription: {
    marginTop: 3,
    fontSize: 12,
    lineHeight: 17,
    color: '#5E788B',
  },

  primaryButton: {
    width: '100%',
    height: 58,
    marginTop: 30,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0868AE',
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
    borderRadius: 16,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#C9DDEB',
    backgroundColor: '#FFFFFF',
  },

  secondaryText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#075A98',
  },
});