import {
  useState,
} from 'react';

import {
  Ionicons,
} from '@expo/vector-icons';

import {
  router,
} from 'expo-router';

import {
  StatusBar,
} from 'expo-status-bar';

import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import {
  registerWithWorkEmail,
} from '../../../services/auth';

import {
  useAuth,
} from '../../context/AuthContext';

export default function CreateAccountScreen() {
  const {
    markAuthenticated,
  } = useAuth();

  const [
    name,
    setName,
  ] =
    useState('');

  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    password,
    setPassword,
  ] =
    useState('');

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState('');

  const [
    showPassword,
    setShowPassword,
  ] =
    useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] =
    useState(false);

  const [
    isCreating,
    setIsCreating,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  async function handleCreateAccount() {
    if (
      isCreating
    ) {
      return;
    }

    setErrorMessage(
      '',
    );

    const cleanName =
      name.trim();

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    if (
      cleanName.length < 2
    ) {
      setErrorMessage(
        'Please enter your full name.',
      );

      return;
    }

    if (!cleanEmail) {
      setErrorMessage(
        'Please enter your work email.',
      );

      return;
    }

    if (
      !cleanEmail.includes(
        '@',
      )
    ) {
      setErrorMessage(
        'Please enter a valid work email.',
      );

      return;
    }

    if (
      password.length < 8
    ) {
      setErrorMessage(
        'Password must contain at least 8 characters.',
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setErrorMessage(
        'Passwords do not match.',
      );

      return;
    }

    try {
      setIsCreating(
        true,
      );

      const createdUser =
        await registerWithWorkEmail({
          name:
            cleanName,

          email:
            cleanEmail,

          password,
        });

      markAuthenticated(
        createdUser,
      );

      router.replace(
        '/(tabs)/home',
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to create your account.',
      );
    } finally {
      setIsCreating(
        false,
      );
    }
  }

  const canSubmit =
    name.trim().length >
      0 &&
    email.trim().length >
      0 &&
    password.length >
      0 &&
    confirmPassword.length >
      0 &&
    !isCreating;

  return (
    <View
      style={
        styles.container
      }
    >
      <StatusBar
        style="dark"
      />

      <KeyboardAvoidingView
        style={
          styles.container
        }
        behavior={
          Platform.OS ===
          'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={
            styles.scrollContent
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={
            false
          }
        >
          <View
            style={
              styles.header
            }
          >
            <Pressable
              onPress={() =>
                router.back()
              }
              style={
                styles.backButton
              }
              hitSlop={
                10
              }
            >
              <Ionicons
                name="chevron-back"
                size={
                  24
                }
                color="#0A3558"
              />
            </Pressable>

            <View
              style={
                styles.headerCenter
              }
            >
              <Text
                style={
                  styles.headerTitle
                }
              >
                Create Account
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                First-time setup
              </Text>
            </View>

            <View
              style={
                styles.headerSpacer
              }
            />
          </View>

          <View
            style={
              styles.content
            }
          >
            <View
              style={
                styles.iconCircle
              }
            >
              <Ionicons
                name="person-add-outline"
                size={
                  32
                }
                color="#0868AE"
              />
            </View>

            <Text
              style={
                styles.title
              }
            >
              Welcome to Sky Avenir
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Create your expense account using your approved work email.
            </Text>

            <View
              style={
                styles.formCard
              }
            >
              <Text
                style={
                  styles.label
                }
              >
                Full Name
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="person-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    name
                  }
                  onChangeText={
                    setName
                  }
                  placeholder="Enter your full name"
                  placeholderTextColor="#91A3B1"
                  autoCapitalize="words"
                  autoCorrect={
                    false
                  }
                  editable={
                    !isCreating
                  }
                  style={
                    styles.input
                  }
                />
              </View>

              <Text
                style={[
                  styles.label,
                  styles.fieldSpacing,
                ]}
              >
                Work Email
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="mail-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    email
                  }
                  onChangeText={
                    setEmail
                  }
                  placeholder="Enter your work email"
                  placeholderTextColor="#91A3B1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  autoComplete="email"
                  editable={
                    !isCreating
                  }
                  style={
                    styles.input
                  }
                />
              </View>

              <Text
                style={[
                  styles.label,
                  styles.fieldSpacing,
                ]}
              >
                Password
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    password
                  }
                  onChangeText={
                    setPassword
                  }
                  placeholder="Minimum 8 characters"
                  placeholderTextColor="#91A3B1"
                  secureTextEntry={
                    !showPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  editable={
                    !isCreating
                  }
                  style={
                    styles.input
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowPassword(
                      (current) =>
                        !current,
                    )
                  }
                  hitSlop={
                    10
                  }
                >
                  <Ionicons
                    name={
                      showPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={
                      20
                    }
                    color="#70879A"
                  />
                </Pressable>
              </View>

              <Text
                style={[
                  styles.label,
                  styles.fieldSpacing,
                ]}
              >
                Confirm Password
              </Text>

              <View
                style={
                  styles.inputContainer
                }
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={
                    19
                  }
                  color="#70879A"
                />

                <TextInput
                  value={
                    confirmPassword
                  }
                  onChangeText={
                    setConfirmPassword
                  }
                  placeholder="Re-enter your password"
                  placeholderTextColor="#91A3B1"
                  secureTextEntry={
                    !showConfirmPassword
                  }
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  editable={
                    !isCreating
                  }
                  returnKeyType="done"
                  onSubmitEditing={
                    handleCreateAccount
                  }
                  style={
                    styles.input
                  }
                />

                <Pressable
                  onPress={() =>
                    setShowConfirmPassword(
                      (current) =>
                        !current,
                    )
                  }
                  hitSlop={
                    10
                  }
                >
                  <Ionicons
                    name={
                      showConfirmPassword
                        ? 'eye-off-outline'
                        : 'eye-outline'
                    }
                    size={
                      20
                    }
                    color="#70879A"
                  />
                </Pressable>
              </View>

              {errorMessage ? (
                <View
                  style={
                    styles.errorBox
                  }
                >
                  <Ionicons
                    name="alert-circle-outline"
                    size={
                      17
                    }
                    color="#B42318"
                  />

                  <Text
                    style={
                      styles.errorText
                    }
                  >
                    {
                      errorMessage
                    }
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={
                  !canSubmit
                }
                onPress={
                  handleCreateAccount
                }
                style={[
                  styles.createButton,

                  !canSubmit &&
                    styles.createButtonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.createButtonText
                  }
                >
                  {
                    isCreating
                      ? 'Creating account...'
                      : 'Create Account'
                  }
                </Text>

                {!isCreating && (
                  <Ionicons
                    name="arrow-forward"
                    size={
                      20
                    }
                    color="#FFFFFF"
                  />
                )}
              </Pressable>
            </View>

            <Pressable
              onPress={() =>
                router.replace(
                  '/(auth)/login',
                )
              }
              style={
                styles.signInLink
              }
            >
              <Text
                style={
                  styles.signInText
                }
              >
                Already have an account?{' '}
                <Text
                  style={
                    styles.signInTextStrong
                  }
                >
                  Sign In
                </Text>
              </Text>
            </Pressable>

            <View
              style={
                styles.securityCard
              }
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={
                  21
                }
                color="#0868AE"
              />

              <Text
                style={
                  styles.securityText
                }
              >
                Your password is securely hashed before being stored. Sky Avenir never stores your plain-text password.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles =
  StyleSheet.create({
    container: {
      flex:
        1,

      backgroundColor:
        '#F4F8FB',
    },

    scrollContent: {
      flexGrow:
        1,
    },

    header: {
      paddingTop:
        50,

      paddingHorizontal:
        18,

      paddingBottom:
        15,

      flexDirection:
        'row',

      alignItems:
        'center',

      borderBottomWidth:
        1,

      borderBottomColor:
        '#E8EEF3',

      backgroundColor:
        '#FFFFFF',
    },

    backButton: {
      width:
        44,

      height:
        44,

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#EFF5F9',
    },

    headerCenter: {
      flex:
        1,

      alignItems:
        'center',
    },

    headerTitle: {
      fontSize:
        18,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    headerSubtitle: {
      marginTop:
        2,

      fontSize:
        10.5,

      color:
        '#8498A8',
    },

    headerSpacer: {
      width:
        44,
    },

    content: {
      flex:
        1,

      paddingHorizontal:
        24,

      paddingTop:
        28,

      paddingBottom:
        32,
    },

    iconCircle: {
      width:
        66,

      height:
        66,

      alignSelf:
        'center',

      borderRadius:
        22,

      alignItems:
        'center',

      justifyContent:
        'center',

      backgroundColor:
        '#E4F1F9',
    },

    title: {
      marginTop:
        17,

      textAlign:
        'center',

      fontSize:
        25,

      fontWeight:
        '700',

      color:
        '#0A3558',
    },

    subtitle: {
      marginTop:
        8,

      paddingHorizontal:
        10,

      textAlign:
        'center',

      fontSize:
        13,

      lineHeight:
        19,

      color:
        '#71879A',
    },

    formCard: {
      marginTop:
        25,

      padding:
        18,

      borderRadius:
        22,

      borderWidth:
        1,

      borderColor:
        '#E0EAF0',

      backgroundColor:
        '#FFFFFF',

      elevation:
        2,
    },

    label: {
      marginBottom:
        8,

      fontSize:
        12.5,

      fontWeight:
        '700',

      color:
        '#294E69',
    },

    fieldSpacing: {
      marginTop:
        15,
    },

    inputContainer: {
      height:
        55,

      paddingHorizontal:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        9,

      borderRadius:
        15,

      borderWidth:
        1,

      borderColor:
        '#D5E2EA',

      backgroundColor:
        '#FBFDFE',
    },

    input: {
      flex:
        1,

      height:
        '100%',

      fontSize:
        14,

      color:
        '#173F60',
    },

    errorBox: {
      marginTop:
        15,

      paddingHorizontal:
        11,

      paddingVertical:
        10,

      flexDirection:
        'row',

      alignItems:
        'flex-start',

      gap:
        7,

      borderRadius:
        12,

      backgroundColor:
        '#FFF0EF',
    },

    errorText: {
      flex:
        1,

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#B42318',
    },

    createButton: {
      height:
        58,

      marginTop:
        20,

      borderRadius:
        17,

      flexDirection:
        'row',

      alignItems:
        'center',

      justifyContent:
        'center',

      gap:
        8,

      backgroundColor:
        '#0868AE',
    },

    createButtonDisabled: {
      opacity:
        0.55,
    },

    createButtonText: {
      fontSize:
        16,

      fontWeight:
        '700',

      color:
        '#FFFFFF',
    },

    signInLink: {
      marginTop:
        20,

      alignItems:
        'center',
    },

    signInText: {
      fontSize:
        12.5,

      color:
        '#627E91',
    },

    signInTextStrong: {
      fontWeight:
        '700',

      color:
        '#0868AE',
    },

    securityCard: {
      marginTop:
        19,

      padding:
        14,

      flexDirection:
        'row',

      alignItems:
        'center',

      gap:
        10,

      borderRadius:
        17,

      backgroundColor:
        '#E8F3FA',
    },

    securityText: {
      flex:
        1,

      fontSize:
        10.5,

      lineHeight:
        15,

      color:
        '#57758A',
    },
  });