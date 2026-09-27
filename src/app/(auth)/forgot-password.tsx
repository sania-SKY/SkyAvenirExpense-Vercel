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
    requestPasswordReset,
} from '../../../services/auth';

export default function ForgotPasswordScreen() {
  const [
    email,
    setEmail,
  ] =
    useState('');

  const [
    isSubmitting,
    setIsSubmitting,
  ] =
    useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] =
    useState('');

  const [
    successMessage,
    setSuccessMessage,
  ] =
    useState('');

  async function handleSendCode() {
    if (
      isSubmitting
    ) {
      return;
    }

    const cleanEmail =
      email
        .trim()
        .toLowerCase();

    setErrorMessage('');
    setSuccessMessage('');

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

    try {
      setIsSubmitting(
        true,
      );

      const message =
        await requestPasswordReset(
          cleanEmail,
        );

      setSuccessMessage(
        message,
      );

      router.push({
        pathname:
          '/(auth)/reset-password',

        params: {
          email:
            cleanEmail,
        },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'Unable to request a password reset.',
      );
    } finally {
      setIsSubmitting(
        false,
      );
    }
  }

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
                Forgot Password
              </Text>

              <Text
                style={
                  styles.headerSubtitle
                }
              >
                Secure account recovery
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
                name="key-outline"
                size={
                  31
                }
                color="#0868AE"
              />
            </View>

            <Text
              style={
                styles.title
              }
            >
              Reset your password
            </Text>

            <Text
              style={
                styles.subtitle
              }
            >
              Enter your Sky Avenir work email.
              We&apos;ll send a 6-digit verification
              code if an account exists.
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
                  placeholder="name@skyavenir.com"
                  placeholderTextColor="#91A3B1"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={
                    false
                  }
                  autoComplete="email"
                  editable={
                    !isSubmitting
                  }
                  returnKeyType="send"
                  onSubmitEditing={
                    handleSendCode
                  }
                  style={
                    styles.input
                  }
                />
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
                    {errorMessage}
                  </Text>
                </View>
              ) : null}

              {successMessage ? (
                <View
                  style={
                    styles.successBox
                  }
                >
                  <Ionicons
                    name="checkmark-circle-outline"
                    size={
                      17
                    }
                    color="#16845B"
                  />

                  <Text
                    style={
                      styles.successText
                    }
                  >
                    {successMessage}
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={
                  isSubmitting
                }
                onPress={
                  handleSendCode
                }
                style={[
                  styles.primaryButton,

                  isSubmitting &&
                    styles.primaryButtonDisabled,
                ]}
              >
                <Text
                  style={
                    styles.primaryButtonText
                  }
                >
                  {isSubmitting
                    ? 'Sending code...'
                    : 'Send Reset Code'}
                </Text>

                {!isSubmitting && (
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
                Remembered your password?{' '}
                <Text
                  style={
                    styles.signInStrong
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
                For security, the app never confirms
                whether a specific email is registered.
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
        34,

      paddingBottom:
        34,
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
        18,

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
        9,

      paddingHorizontal:
        8,

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
        26,

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
        14,

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

    successBox: {
      marginTop:
        14,

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
        '#EAF7F0',
    },

    successText: {
      flex:
        1,

      fontSize:
        11,

      lineHeight:
        16,

      color:
        '#16845B',
    },

    primaryButton: {
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

    primaryButtonDisabled: {
      opacity:
        0.6,
    },

    primaryButtonText: {
      fontSize:
        15,

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

    signInStrong: {
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