import { useState } from 'react';

import { Ionicons } from '@expo/vector-icons';
import {
    router,
    useLocalSearchParams,
} from 'expo-router';

import { StatusBar } from 'expo-status-bar';

import {
    Alert,
    Pressable,
    StyleSheet,
    Text,
    TextInput,
    View,
} from 'react-native';

export default function CreateAccountScreen() {
  const params = useLocalSearchParams<{
    name?: string;
    email?: string;
    provider?: string;
  }>();

  const [name, setName] = useState(
    params.name ?? '',
  );

  const email = params.email ?? '';

  const provider =
    params.provider === 'google'
      ? 'Google'
      : 'Microsoft';

  const [isCreating, setIsCreating] =
    useState(false);

  async function createAccount() {
    if (!name.trim()) {
      Alert.alert(
        'Name required',
        'Please enter your name.',
      );

      return;
    }

    if (!email) {
      Alert.alert(
        'Email unavailable',
        'We could not verify your email address.',
      );

      return;
    }

    try {
      setIsCreating(true);

      /*
       * Later:
       *
       * await createUserAccount({
       *   name,
       *   email,
       *   provider
       * });
       */

      await new Promise((resolve) =>
        setTimeout(resolve, 500),
      );

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error(
        'Create account error:',
        error,
      );

      Alert.alert(
        'Unable to create account',
        'Please try again.',
      );
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <View style={styles.container}>
      <StatusBar
        style="dark"
        backgroundColor="#F4F8FB"
      />

      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons
            name="chevron-back"
            size={24}
            color="#0A3558"
          />
        </Pressable>

        <View style={styles.headerText}>
          <Text style={styles.headerTitle}>
            Create Your Account
          </Text>

          <Text style={styles.headerSubtitle}>
            One-time setup
          </Text>
        </View>

        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.welcomeIcon}>
          <Ionicons
            name="person-add-outline"
            size={31}
            color="#0868AE"
          />
        </View>

        <Text style={styles.title}>
          Welcome to Sky Avenir
        </Text>

        <Text style={styles.subtitle}>
          Your {provider} account has been
          verified. Confirm your details to
          finish setting up your expense account.
        </Text>

        <View style={styles.formCard}>
          <Text style={styles.label}>
            Full Name
          </Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="person-outline"
              size={19}
              color="#70879A"
            />

            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor="#91A3B1"
              style={styles.input}
            />
          </View>

          <Text style={styles.label}>
            Work Email
          </Text>

          <View
            style={[
              styles.inputContainer,
              styles.readOnlyInput,
            ]}
          >
            <Ionicons
              name="mail-outline"
              size={19}
              color="#70879A"
            />

            <Text
              numberOfLines={1}
              style={styles.emailText}
            >
              {email ||
                'Verified email unavailable'}
            </Text>

            <Ionicons
              name="checkmark-circle"
              size={19}
              color="#16845B"
            />
          </View>

          <Text style={styles.providerLabel}>
            Verified with {provider}
          </Text>
        </View>

        <View style={styles.infoCard}>
          <Ionicons
            name="shield-checkmark-outline"
            size={21}
            color="#0868AE"
          />

          <Text style={styles.infoText}>
            No additional password is required.
            Your verified company account is used
            for secure sign-in.
          </Text>
        </View>

        <Pressable
          disabled={isCreating}
          onPress={createAccount}
          style={[
            styles.createButton,
            isCreating &&
              styles.createButtonDisabled,
          ]}
        >
          <Text style={styles.createButtonText}>
            {isCreating
              ? 'Creating account...'
              : 'Create Account'}
          </Text>

          {!isCreating && (
            <Ionicons
              name="arrow-forward"
              size={20}
              color="#FFFFFF"
            />
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F8FB',
  },

  header: {
    paddingTop: 50,
    paddingHorizontal: 18,
    paddingBottom: 15,
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEF3',
    backgroundColor: '#FFFFFF',
  },

  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF5F9',
  },

  headerText: {
    flex: 1,
    alignItems: 'center',
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0A3558',
  },

  headerSubtitle: {
    marginTop: 2,
    fontSize: 10.5,
    color: '#8498A8',
  },

  headerSpacer: {
    width: 44,
  },

  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 30,
  },

  welcomeIcon: {
    width: 67,
    height: 67,
    alignSelf: 'center',
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E4F1F9',
  },

  title: {
    marginTop: 18,
    textAlign: 'center',
    fontSize: 25,
    fontWeight: '700',
    color: '#0A3558',
  },

  subtitle: {
    marginTop: 8,
    paddingHorizontal: 8,
    textAlign: 'center',
    fontSize: 13,
    lineHeight: 19,
    color: '#71879A',
  },

  formCard: {
    marginTop: 27,
    padding: 17,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    elevation: 2,
  },

  label: {
    marginBottom: 8,
    marginTop: 10,
    fontSize: 12.5,
    fontWeight: '700',
    color: '#294E69',
  },

  inputContainer: {
    height: 56,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 9,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#D5E2EA',
    backgroundColor: '#FBFDFE',
  },

  readOnlyInput: {
    backgroundColor: '#F3F7FA',
  },

  input: {
    flex: 1,
    fontSize: 14,
    color: '#173F60',
  },

  emailText: {
    flex: 1,
    fontSize: 13.5,
    color: '#526E82',
  },

  providerLabel: {
    marginTop: 9,
    fontSize: 10.5,
    color: '#7E93A3',
  },

  infoCard: {
    marginTop: 16,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderRadius: 17,
    backgroundColor: '#E8F3FA',
  },

  infoText: {
    flex: 1,
    fontSize: 10.5,
    lineHeight: 15,
    color: '#57758A',
  },

  createButton: {
    height: 58,
    marginTop: 22,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0868AE',
  },

  createButtonDisabled: {
    opacity: 0.65,
  },

  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});