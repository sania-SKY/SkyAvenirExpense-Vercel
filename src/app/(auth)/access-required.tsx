import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import {
    Pressable,
    StyleSheet,
    Text,
    View,
} from 'react-native';

export default function AccessRequiredScreen() {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      <View style={styles.icon}>
        <Ionicons
          name="lock-closed-outline"
          size={35}
          color="#A66A00"
        />
      </View>

      <Text style={styles.title}>
        Access Required
      </Text>

      <Text style={styles.subtitle}>
        Your account was successfully verified,
        but it does not currently have access to
        Sky Avenir Expense.
      </Text>

      <View style={styles.card}>
        <Ionicons
          name="information-circle-outline"
          size={21}
          color="#0868AE"
        />

        <Text style={styles.cardText}>
          Contact your administrator if you
          believe you should have access.
        </Text>
      </View>

      <Pressable
        onPress={() =>
          router.replace('/(auth)/login')
        }
        style={styles.button}
      >
        <Ionicons
          name="arrow-back"
          size={19}
          color="#0868AE"
        />

        <Text style={styles.buttonText}>
          Back to Sign In
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
    backgroundColor: '#F4F8FB',
  },

  icon: {
    width: 82,
    height: 82,
    borderRadius: 27,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFF4DD',
  },

  title: {
    marginTop: 23,
    fontSize: 25,
    fontWeight: '700',
    color: '#0A3558',
  },

  subtitle: {
    marginTop: 9,
    maxWidth: 330,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 20,
    color: '#71879A',
  },

  card: {
    width: '100%',
    marginTop: 27,
    padding: 15,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 18,
    backgroundColor: '#E8F3FA',
  },

  cardText: {
    flex: 1,
    fontSize: 11.5,
    lineHeight: 17,
    color: '#57758A',
  },

  button: {
    width: '100%',
    height: 56,
    marginTop: 22,
    flexDirection: 'row',
    gap: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#C8DDEA',
    backgroundColor: '#FFFFFF',
  },

  buttonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0868AE',
  },
});